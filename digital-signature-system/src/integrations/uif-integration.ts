import axios, { AxiosInstance } from 'axios';
import * as crypto from 'crypto';

interface SuspiciousActivityReport {
  reportId: string;
  clientId: string;
  cedula: string;
  fullName: string;
  activityType: string; // SPIKE, CIRCULAR_FLOW, STRUCTURING, OTHER
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  amount: number;
  currency: string;
  description: string;
  evidence: string;
  reportedBy: string;
  timestamp: string;
  signature: string;
}

interface UIFReportResponse {
  success: boolean;
  reportNumber?: string;
  status?: string;
  receivedAt?: string;
  nextReviewDate?: string;
  errorCode?: string;
  errorMessage?: string;
}

interface UIFConfig {
  apiUrl: string;
  apiKey: string;
  apiSecret: string;
  institutionId: string;
  timeout: number;
  retries: number;
}

export class UIFIntegration {
  private client: AxiosInstance;
  private config: UIFConfig;

  constructor(config: UIFConfig) {
    this.config = {
      timeout: 45000,
      retries: 3,
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
        request.headers['X-Institution-ID'] = this.config.institutionId;
        request.headers['X-API-Key'] = this.config.apiKey;
        request.headers['X-Signature'] = signature;
        request.headers['X-Timestamp'] = new Date().toISOString();
      }
      return request;
    });
  }

  private generateSignature(url: string, data: any): string {
    const payload = `${url}${JSON.stringify(data || {})}${this.config.institutionId}`;
    return crypto
      .createHmac('sha256', this.config.apiSecret)
      .update(payload)
      .digest('hex');
  }

  async reportSuspiciousActivity(
    report: SuspiciousActivityReport
  ): Promise<UIFReportResponse> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.retries; attempt++) {
      try {
        console.log(
          `🚨 UIF: Reporting suspicious activity ${report.reportId} [${report.severity}] (attempt ${attempt}/${this.config.retries})`
        );

        const response = await this.client.post<UIFReportResponse>(
          '/api/v1/reports/suspicious-activity',
          report
        );

        const result = response.data;

        console.log(`✅ UIF: Suspicious activity report submitted`, {
          reportId: report.reportId,
          reportNumber: result.reportNumber,
          severity: report.severity,
          status: result.status,
        });

        return result;
      } catch (error: any) {
        lastError = error;
        console.warn(
          `⚠️  UIF submission attempt ${attempt} failed:`,
          error.response?.data?.errorMessage || error.message
        );

        if (attempt < this.config.retries) {
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    console.error('❌ UIF: All submission attempts failed');
    throw lastError || new Error('UIF suspicious activity report failed');
  }

  async reportStructuringActivity(
    clientId: string,
    cedula: string,
    fullName: string,
    transactions: any[],
    totalAmount: number
  ): Promise<UIFReportResponse> {
    console.log(
      `🚨 UIF: Reporting structuring activity for ${cedula} (${transactions.length} transactions)`
    );

    const report: SuspiciousActivityReport = {
      reportId: `UIF-STRUCT-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`,
      clientId,
      cedula,
      fullName,
      activityType: 'STRUCTURING',
      severity: 'HIGH',
      amount: totalAmount,
      currency: 'EUR',
      description: `Multiple small transactions detected: ${transactions.length} transactions totaling €${totalAmount}`,
      evidence: JSON.stringify({
        transactions: transactions.map((t) => ({
          amount: t.amount,
          date: t.date,
          description: t.description,
        })),
      }),
      reportedBy: 'AUTOMATED_AML_SYSTEM',
      timestamp: new Date().toISOString(),
      signature: '', // Will be filled by compliance system
    };

    return this.reportSuspiciousActivity(report);
  }

  async reportCircularFlowActivity(
    clientId: string,
    cedula: string,
    fullName: string,
    flow: { from: string; to: string; amount: number; date: string }[]
  ): Promise<UIFReportResponse> {
    console.log(
      `🚨 UIF: Reporting circular flow activity for ${cedula} (${flow.length} flows)`
    );

    const totalAmount = flow.reduce((sum, f) => sum + f.amount, 0);

    const report: SuspiciousActivityReport = {
      reportId: `UIF-CIRC-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`,
      clientId,
      cedula,
      fullName,
      activityType: 'CIRCULAR_FLOW',
      severity: 'CRITICAL',
      amount: totalAmount,
      currency: 'EUR',
      description: `Circular flow pattern detected: funds moving in circular pattern between accounts`,
      evidence: JSON.stringify({
        flows: flow,
        pattern: 'A→B→A or similar cycles detected',
      }),
      reportedBy: 'AUTOMATED_AML_SYSTEM',
      timestamp: new Date().toISOString(),
      signature: '',
    };

    return this.reportSuspiciousActivity(report);
  }

  async reportSpikeActivity(
    clientId: string,
    cedula: string,
    fullName: string,
    normalAverage: number,
    spikeAmount: number,
    multiplier: number
  ): Promise<UIFReportResponse> {
    console.log(
      `🚨 UIF: Reporting transaction spike for ${cedula} (€${spikeAmount} vs avg €${normalAverage})`
    );

    const report: SuspiciousActivityReport = {
      reportId: `UIF-SPIKE-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`,
      clientId,
      cedula,
      fullName,
      activityType: 'SPIKE',
      severity: 'MEDIUM',
      amount: spikeAmount,
      currency: 'EUR',
      description: `Transaction spike detected: ${multiplier.toFixed(1)}x average amount`,
      evidence: JSON.stringify({
        normalAverage,
        spikeAmount,
        multiplier,
        threshold: 3.0,
      }),
      reportedBy: 'AUTOMATED_AML_SYSTEM',
      timestamp: new Date().toISOString(),
      signature: '',
    };

    return this.reportSuspiciousActivity(report);
  }

  async getReportStatus(reportNumber: string): Promise<{
    status: string;
    submittedAt: string;
    investigationStatus: string;
    nextReviewDate?: string;
  }> {
    try {
      console.log(`🔍 UIF: Checking status of report ${reportNumber}`);

      const response = await this.client.get<{
        status: string;
        submittedAt: string;
        investigationStatus: string;
        nextReviewDate?: string;
      }>(`/api/v1/reports/${reportNumber}/status`);

      const status = response.data;
      console.log(`✅ UIF: Report status retrieved`, status);

      return status;
    } catch (error: any) {
      console.error('❌ UIF: Status check failed:', error.message);
      throw error;
    }
  }

  async getCaseDetails(reportNumber: string): Promise<{
    reportNumber: string;
    status: string;
    severity: string;
    investigationStatus: string;
    actionsTaken?: string[];
    conclusion?: string;
  }> {
    try {
      console.log(`📋 UIF: Getting case details for ${reportNumber}`);

      const response = await this.client.get<{
        reportNumber: string;
        status: string;
        severity: string;
        investigationStatus: string;
        actionsTaken?: string[];
        conclusion?: string;
      }>(`/api/v1/reports/${reportNumber}/details`);

      const details = response.data;
      console.log(`✅ UIF: Case details retrieved`);

      return details;
    } catch (error: any) {
      console.error('❌ UIF: Case details retrieval failed:', error.message);
      throw error;
    }
  }

  async getReportingStatistics(year: number): Promise<{
    totalReports: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
    resolved: number;
    investigating: number;
  }> {
    try {
      console.log(`📊 UIF: Getting reporting statistics for year ${year}`);

      const response = await this.client.get<{
        totalReports: number;
        byType: Record<string, number>;
        bySeverity: Record<string, number>;
        resolved: number;
        investigating: number;
      }>(`/api/v1/statistics/${year}`);

      const stats = response.data;
      console.log(`✅ UIF: Statistics retrieved`, {
        totalReports: stats.totalReports,
        resolved: stats.resolved,
        investigating: stats.investigating,
      });

      return stats;
    } catch (error: any) {
      console.error('❌ UIF: Statistics retrieval failed:', error.message);
      throw error;
    }
  }

  async submitComplianceReport(): Promise<{
    reportDate: string;
    status: string;
    submittedAt: string;
  }> {
    try {
      console.log(`📑 UIF: Submitting monthly compliance report`);

      const response = await this.client.post<{
        reportDate: string;
        status: string;
        submittedAt: string;
      }>('/api/v1/compliance/monthly-report', {
        institutionId: this.config.institutionId,
        reportDate: new Date().toISOString().split('T')[0],
      });

      const result = response.data;
      console.log(`✅ UIF: Compliance report submitted`, result);

      return result;
    } catch (error: any) {
      console.error('❌ UIF: Compliance report submission failed:', error.message);
      throw error;
    }
  }
}

export default UIFIntegration;
