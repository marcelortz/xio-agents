import axios, { AxiosInstance } from 'axios';
import * as crypto from 'crypto';

interface CedulaValidationRequest {
  cedula: string;
  fullName: string;
}

interface CedulaValidationResponse {
  valid: boolean;
  cedula: string;
  fullName: string;
  status: string;
  riskLevel: number;
  deathStatus: boolean;
  documentType: string;
  issueDate?: string;
  expiryDate?: string;
  errorCode?: string;
  errorMessage?: string;
}

interface SENESCYTConfig {
  apiUrl: string;
  apiKey: string;
  apiSecret: string;
  timeout: number;
  retries: number;
}

export class SENESCYTIntegration {
  private client: AxiosInstance;
  private config: SENESCYTConfig;

  constructor(config: SENESCYTConfig) {
    this.config = {
      timeout: 30000,
      retries: 3,
      ...config,
    };

    this.client = axios.create({
      baseURL: this.config.apiUrl,
      timeout: this.config.timeout,
    });

    // Add request interceptor for authentication
    this.client.interceptors.request.use((request) => {
      if (request.url) {
        const signature = this.generateSignature(request.url, request.data);
        request.headers['X-API-Key'] = this.config.apiKey;
        request.headers['X-Signature'] = signature;
        request.headers['X-Timestamp'] = new Date().toISOString();
      }
      return request;
    });
  }

  private generateSignature(url: string, data: any): string {
    const payload = `${url}${JSON.stringify(data || {})}`;
    return crypto
      .createHmac('sha256', this.config.apiSecret)
      .update(payload)
      .digest('hex');
  }

  async validateCedula(
    cedula: string,
    fullName: string
  ): Promise<CedulaValidationResponse> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.retries; attempt++) {
      try {
        console.log(
          `🔍 SENESCYT: Validating cedula ${cedula} (attempt ${attempt}/${this.config.retries})`
        );

        const response = await this.client.post<CedulaValidationResponse>(
          '/api/v1/cedula/validate',
          {
            cedula,
            fullName,
          }
        );

        const validation = response.data;

        console.log(`✅ SENESCYT: Cedula validation result`, {
          cedula,
          valid: validation.valid,
          status: validation.status,
          riskLevel: validation.riskLevel,
        });

        return validation;
      } catch (error: any) {
        lastError = error;
        console.warn(
          `⚠️  SENESCYT attempt ${attempt} failed:`,
          error.message
        );

        if (attempt < this.config.retries) {
          // Exponential backoff
          await new Promise((resolve) =>
            setTimeout(resolve, Math.pow(2, attempt) * 1000)
          );
        }
      }
    }

    console.error('❌ SENESCYT: All validation attempts failed');
    throw lastError || new Error('SENESCYT validation failed');
  }

  async checkDeathRegistry(cedula: string): Promise<boolean> {
    try {
      console.log(`🔍 SENESCYT: Checking death registry for ${cedula}`);

      const response = await this.client.get<{ isDead: boolean }>(
        `/api/v1/cedula/${cedula}/death-status`
      );

      const isDead = response.data.isDead;
      console.log(`✅ SENESCYT: Death status check complete (isDead: ${isDead})`);

      return isDead;
    } catch (error: any) {
      console.error('❌ SENESCYT: Death registry check failed:', error.message);
      throw error;
    }
  }

  async getRiskProfile(cedula: string): Promise<number> {
    try {
      console.log(`🔍 SENESCYT: Getting risk profile for ${cedula}`);

      const response = await this.client.get<{ riskScore: number }>(
        `/api/v1/cedula/${cedula}/risk-profile`
      );

      const riskScore = response.data.riskScore;
      console.log(
        `✅ SENESCYT: Risk profile retrieved (score: ${riskScore})`
      );

      return riskScore;
    } catch (error: any) {
      console.error('❌ SENESCYT: Risk profile retrieval failed:', error.message);
      throw error;
    }
  }

  async validateFullName(cedula: string, fullName: string): Promise<boolean> {
    try {
      console.log(
        `🔍 SENESCYT: Validating full name for ${cedula}: ${fullName}`
      );

      const response = await this.client.post<{ matches: boolean }>(
        `/api/v1/cedula/${cedula}/validate-name`,
        { fullName }
      );

      const matches = response.data.matches;
      console.log(`✅ SENESCYT: Name validation complete (matches: ${matches})`);

      return matches;
    } catch (error: any) {
      console.error('❌ SENESCYT: Name validation failed:', error.message);
      throw error;
    }
  }

  async getDocumentStatus(cedula: string): Promise<{
    status: string;
    issueDate: string;
    expiryDate: string;
  }> {
    try {
      console.log(`🔍 SENESCYT: Getting document status for ${cedula}`);

      const response = await this.client.get<{
        status: string;
        issueDate: string;
        expiryDate: string;
      }>(`/api/v1/cedula/${cedula}/document-status`);

      const status = response.data;
      console.log(`✅ SENESCYT: Document status retrieved`, status);

      return status;
    } catch (error: any) {
      console.error('❌ SENESCYT: Document status retrieval failed:', error.message);
      throw error;
    }
  }
}

export default SENESCYTIntegration;
