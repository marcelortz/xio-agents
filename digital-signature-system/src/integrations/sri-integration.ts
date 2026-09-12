import axios, { AxiosInstance } from 'axios';
import * as crypto from 'crypto';

interface TaxReportSubmission {
  reportId: string;
  taxpayerId: string;
  grossAmount: number;
  ivaAmount: number;
  retentionAmount: number;
  netAmount: number;
  currency: string;
  signature: string;
  timestamp: string;
}

interface SRIReportResponse {
  success: boolean;
  receiptNumber?: string;
  status?: string;
  processedAt?: string;
  errorCode?: string;
  errorMessage?: string;
}

interface SRIConfig {
  apiUrl: string;
  apiKey: string;
  apiSecret: string;
  taxpayerId: string;
  timeout: number;
  retries: number;
}

export class SRIIntegration {
  private client: AxiosInstance;
  private config: SRIConfig;
  private batchQueue: TaxReportSubmission[] = [];
  private batchSize = 100;
  private batchInterval = 3600000; // 1 hour

  constructor(config: SRIConfig) {
    this.config = {
      timeout: 60000,
      retries: 5,
      ...config,
    };

    this.client = axios.create({
      baseURL: this.config.apiUrl,
      timeout: this.config.timeout,
    });

    // Add authentication interceptor
    this.client.interceptors.request.use((request) => {
      if (request.url) {
        const signature = this.generateSignature(
          request.url,
          request.data
        );
        request.headers['Authorization'] = `Bearer ${this.config.apiKey}`;
        request.headers['X-Signature'] = signature;
        request.headers['X-Timestamp'] = new Date().toISOString();
      }
      return request;
    });

    // Start batch processor
    this.startBatchProcessor();
  }

  private generateSignature(url: string, data: any): string {
    const payload = `${url}${JSON.stringify(data || {})}${this.config.taxpayerId}`;
    return crypto
      .createHmac('sha256', this.config.apiSecret)
      .update(payload)
      .digest('hex');
  }

  async submitTaxReport(
    report: TaxReportSubmission
  ): Promise<SRIReportResponse> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.retries; attempt++) {
      try {
        console.log(
          `📤 SRI: Submitting tax report ${report.reportId} (attempt ${attempt}/${this.config.retries})`
        );

        const response = await this.client.post<SRIReportResponse>(
          '/api/v2/tax-reports/submit',
          {
            ...report,
            taxpayerId: this.config.taxpayerId,
          }
        );

        const result = response.data;

        console.log(`✅ SRI: Tax report submitted successfully`, {
          reportId: report.reportId,
          receiptNumber: result.receiptNumber,
          status: result.status,
        });

        return result;
      } catch (error: any) {
        lastError = error;
        console.warn(
          `⚠️  SRI submission attempt ${attempt} failed:`,
          error.response?.data?.errorMessage || error.message
        );

        if (attempt < this.config.retries) {
          // Exponential backoff with jitter
          const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    console.error('❌ SRI: All submission attempts failed');
    throw lastError || new Error('SRI tax report submission failed');
  }

  async submitBatch(reports: TaxReportSubmission[]): Promise<{
    successful: number;
    failed: number;
    results: SRIReportResponse[];
  }> {
    console.log(`📤 SRI: Submitting batch of ${reports.length} tax reports`);

    const results: SRIReportResponse[] = [];
    let successful = 0;
    let failed = 0;

    for (const report of reports) {
      try {
        const result = await this.submitTaxReport(report);
        results.push(result);
        successful++;
      } catch (error: any) {
        results.push({
          success: false,
          errorMessage: error.message,
        });
        failed++;
      }
    }

    console.log(`📊 SRI Batch results: ${successful} successful, ${failed} failed`);

    return { successful, failed, results };
  }

  async queueTaxReport(report: TaxReportSubmission): Promise<void> {
    console.log(`📋 SRI: Queuing tax report ${report.reportId}`);
    this.batchQueue.push(report);

    // Submit immediately if queue is full
    if (this.batchQueue.length >= this.batchSize) {
      await this.processBatch();
    }
  }

  private async processBatch(): Promise<void> {
    if (this.batchQueue.length === 0) {
      return;
    }

    const batch = this.batchQueue.splice(0, this.batchSize);
    console.log(`🔄 SRI: Processing batch of ${batch.length} queued reports`);

    try {
      await this.submitBatch(batch);
    } catch (error: any) {
      console.error('❌ SRI: Batch processing failed:', error.message);
      // Re-queue failed reports
      this.batchQueue.unshift(...batch);
    }
  }

  private startBatchProcessor(): void {
    setInterval(async () => {
      if (this.batchQueue.length > 0) {
        console.log(`⏰ SRI: Batch interval triggered, processing ${this.batchQueue.length} pending reports`);
        await this.processBatch();
      }
    }, this.batchInterval);
  }

  async getTaxReportStatus(reportId: string): Promise<{
    status: string;
    receiptNumber?: string;
    submittedAt?: string;
  }> {
    try {
      console.log(`🔍 SRI: Checking status of report ${reportId}`);

      const response = await this.client.get<{
        status: string;
        receiptNumber?: string;
        submittedAt?: string;
      }>(`/api/v2/tax-reports/${reportId}/status`);

      const status = response.data;
      console.log(`✅ SRI: Report status retrieved`, status);

      return status;
    } catch (error: any) {
      console.error('❌ SRI: Status check failed:', error.message);
      throw error;
    }
  }

  async downloadReceipt(receiptNumber: string): Promise<Buffer> {
    try {
      console.log(`📥 SRI: Downloading receipt ${receiptNumber}`);

      const response = await this.client.get<ArrayBuffer>(
        `/api/v2/tax-reports/receipts/${receiptNumber}`,
        { responseType: 'arraybuffer' }
      );

      console.log(`✅ SRI: Receipt downloaded (${response.data.byteLength} bytes)`);

      return Buffer.from(response.data);
    } catch (error: any) {
      console.error('❌ SRI: Receipt download failed:', error.message);
      throw error;
    }
  }

  async getTaxFilingSummary(year: number): Promise<{
    totalReports: number;
    totalIVA: number;
    totalRetentions: number;
    successfullyFiled: number;
    pendingFiling: number;
  }> {
    try {
      console.log(`📊 SRI: Getting tax filing summary for year ${year}`);

      const response = await this.client.get<{
        totalReports: number;
        totalIVA: number;
        totalRetentions: number;
        successfullyFiled: number;
        pendingFiling: number;
      }>(`/api/v2/tax-reports/summary/${year}`);

      const summary = response.data;
      console.log(`✅ SRI: Filing summary retrieved`, summary);

      return summary;
    } catch (error: any) {
      console.error('❌ SRI: Summary retrieval failed:', error.message);
      throw error;
    }
  }

  getQueuedReportsCount(): number {
    return this.batchQueue.length;
  }

  async flushQueue(): Promise<void> {
    console.log(`🚀 SRI: Flushing queue with ${this.batchQueue.length} pending reports`);
    while (this.batchQueue.length > 0) {
      await this.processBatch();
    }
    console.log(`✅ SRI: Queue flushed successfully`);
  }
}

export default SRIIntegration;
