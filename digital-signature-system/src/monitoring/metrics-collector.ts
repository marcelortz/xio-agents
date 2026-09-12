import prom from 'prom-client';

interface MetricLabels {
  endpoint?: string;
  method?: string;
  status?: string;
  operation?: string;
  layer?: string;
  service?: string;
  severity?: string;
}

export class MetricsCollector {
  private register: prom.Registry;

  // HTTP Metrics
  private httpRequestDuration: prom.Histogram;
  private httpRequestTotal: prom.Counter;
  private httpRequestSize: prom.Histogram;
  private httpResponseSize: prom.Histogram;

  // Business Metrics - KYC/AML
  private kycVerifications: prom.Counter;
  private amlChecksFailed: prom.Counter;
  private riskyClients: prom.Gauge;
  private amlFlagsCreated: prom.Counter;

  // Business Metrics - Segregation
  private accountsCreated: prom.Counter;
  private transactionsRecorded: prom.Counter;
  private totalAUM: prom.Gauge;
  private guaranteeFund: prom.Gauge;

  // Business Metrics - Tax
  private taxReportsGenerated: prom.Counter;
  private taxReportsSubmitted: prom.Counter;
  private totalIVAFiled: prom.Counter;
  private totalRetentionsFilied: prom.Counter;

  // Integration Metrics
  private integrationApiCalls: prom.Counter;
  private integrationApiErrors: prom.Counter;
  private integrationApiDuration: prom.Histogram;

  // System Metrics
  private activeConnections: prom.Gauge;
  private databaseConnections: prom.Gauge;
  private processUptime: prom.Gauge;
  private memoryUsage: prom.Gauge;
  private cpuUsage: prom.Gauge;

  // Security Metrics
  private failedAuthentications: prom.Counter;
  private unauthorizedAccess: prom.Counter;
  private suspiciousActivities: prom.Counter;

  constructor() {
    this.register = new prom.Registry();

    // HTTP Metrics
    this.httpRequestDuration = new prom.Histogram({
      name: 'http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['endpoint', 'method', 'status'],
      buckets: [0.1, 0.5, 1, 2, 5],
      registers: [this.register],
    });

    this.httpRequestTotal = new prom.Counter({
      name: 'http_requests_total',
      help: 'Total HTTP requests',
      labelNames: ['endpoint', 'method', 'status'],
      registers: [this.register],
    });

    this.httpRequestSize = new prom.Histogram({
      name: 'http_request_size_bytes',
      help: 'HTTP request size in bytes',
      labelNames: ['endpoint', 'method'],
      buckets: [100, 1000, 10000, 100000],
      registers: [this.register],
    });

    this.httpResponseSize = new prom.Histogram({
      name: 'http_response_size_bytes',
      help: 'HTTP response size in bytes',
      labelNames: ['endpoint', 'method', 'status'],
      buckets: [100, 1000, 10000, 100000],
      registers: [this.register],
    });

    // Business Metrics - KYC/AML
    this.kycVerifications = new prom.Counter({
      name: 'kyc_verifications_total',
      help: 'Total KYC verifications',
      labelNames: ['status'],
      registers: [this.register],
    });

    this.amlChecksFailed = new prom.Counter({
      name: 'aml_checks_failed_total',
      help: 'Total AML check failures',
      labelNames: ['reason'],
      registers: [this.register],
    });

    this.riskyClients = new prom.Gauge({
      name: 'risky_clients',
      help: 'Number of clients with high risk score',
      registers: [this.register],
    });

    this.amlFlagsCreated = new prom.Counter({
      name: 'aml_flags_created_total',
      help: 'Total AML flags created',
      labelNames: ['type', 'severity'],
      registers: [this.register],
    });

    // Business Metrics - Segregation
    this.accountsCreated = new prom.Counter({
      name: 'accounts_created_total',
      help: 'Total segregated accounts created',
      labelNames: ['type'],
      registers: [this.register],
    });

    this.transactionsRecorded = new prom.Counter({
      name: 'transactions_recorded_total',
      help: 'Total transactions recorded',
      labelNames: ['type', 'status'],
      registers: [this.register],
    });

    this.totalAUM = new prom.Gauge({
      name: 'total_aum_euros',
      help: 'Total Assets Under Management in EUR',
      registers: [this.register],
    });

    this.guaranteeFund = new prom.Gauge({
      name: 'guarantee_fund_euros',
      help: 'Guarantee fund balance in EUR',
      registers: [this.register],
    });

    // Business Metrics - Tax
    this.taxReportsGenerated = new prom.Counter({
      name: 'tax_reports_generated_total',
      help: 'Total tax reports generated',
      registers: [this.register],
    });

    this.taxReportsSubmitted = new prom.Counter({
      name: 'tax_reports_submitted_total',
      help: 'Total tax reports submitted to SRI',
      labelNames: ['status'],
      registers: [this.register],
    });

    this.totalIVAFiled = new prom.Counter({
      name: 'total_iva_filed_euros',
      help: 'Total IVA filed in EUR',
      registers: [this.register],
    });

    this.totalRetentionsFilied = new prom.Counter({
      name: 'total_retentions_filed_euros',
      help: 'Total retentions filed in EUR',
      registers: [this.register],
    });

    // Integration Metrics
    this.integrationApiCalls = new prom.Counter({
      name: 'integration_api_calls_total',
      help: 'Total integration API calls',
      labelNames: ['service', 'endpoint'],
      registers: [this.register],
    });

    this.integrationApiErrors = new prom.Counter({
      name: 'integration_api_errors_total',
      help: 'Total integration API errors',
      labelNames: ['service', 'error_code'],
      registers: [this.register],
    });

    this.integrationApiDuration = new prom.Histogram({
      name: 'integration_api_duration_seconds',
      help: 'Integration API duration in seconds',
      labelNames: ['service'],
      buckets: [0.5, 1, 2, 5, 10],
      registers: [this.register],
    });

    // System Metrics
    this.activeConnections = new prom.Gauge({
      name: 'active_connections',
      help: 'Number of active connections',
      registers: [this.register],
    });

    this.databaseConnections = new prom.Gauge({
      name: 'database_connections',
      help: 'Number of active database connections',
      registers: [this.register],
    });

    this.processUptime = new prom.Gauge({
      name: 'process_uptime_seconds',
      help: 'Process uptime in seconds',
      registers: [this.register],
    });

    this.memoryUsage = new prom.Gauge({
      name: 'memory_usage_bytes',
      help: 'Memory usage in bytes',
      registers: [this.register],
    });

    this.cpuUsage = new prom.Gauge({
      name: 'cpu_usage_percent',
      help: 'CPU usage percentage',
      registers: [this.register],
    });

    // Security Metrics
    this.failedAuthentications = new prom.Counter({
      name: 'failed_authentications_total',
      help: 'Total failed authentication attempts',
      registers: [this.register],
    });

    this.unauthorizedAccess = new prom.Counter({
      name: 'unauthorized_access_total',
      help: 'Total unauthorized access attempts',
      labelNames: ['resource'],
      registers: [this.register],
    });

    this.suspiciousActivities = new prom.Counter({
      name: 'suspicious_activities_total',
      help: 'Total suspicious activities detected',
      labelNames: ['type', 'severity'],
      registers: [this.register],
    });
  }

  // HTTP Metrics Methods
  recordHttpRequest(
    endpoint: string,
    method: string,
    status: number,
    duration: number,
    requestSize: number,
    responseSize: number
  ): void {
    this.httpRequestDuration.labels(endpoint, method, String(status)).observe(duration);
    this.httpRequestTotal.labels(endpoint, method, String(status)).inc();
    this.httpRequestSize.labels(endpoint, method).observe(requestSize);
    this.httpResponseSize.labels(endpoint, method, String(status)).observe(responseSize);
  }

  // KYC/AML Metrics Methods
  recordKYCVerification(status: string): void {
    this.kycVerifications.labels(status).inc();
  }

  recordAMLCheckFailed(reason: string): void {
    this.amlChecksFailed.labels(reason).inc();
  }

  setRiskyClientsCount(count: number): void {
    this.riskyClients.set(count);
  }

  recordAMLFlagCreated(type: string, severity: string): void {
    this.amlFlagsCreated.labels(type, severity).inc();
  }

  // Segregation Metrics Methods
  recordAccountCreated(type: string): void {
    this.accountsCreated.labels(type).inc();
  }

  recordTransactionRecorded(type: string, status: string): void {
    this.transactionsRecorded.labels(type, status).inc();
  }

  setTotalAUM(amount: number): void {
    this.totalAUM.set(amount);
  }

  setGuaranteeFund(amount: number): void {
    this.guaranteeFund.set(amount);
  }

  // Tax Metrics Methods
  recordTaxReportGenerated(): void {
    this.taxReportsGenerated.inc();
  }

  recordTaxReportSubmitted(status: string): void {
    this.taxReportsSubmitted.labels(status).inc();
  }

  recordIVAFiled(amount: number): void {
    this.totalIVAFiled.inc(amount);
  }

  recordRetentionsFiled(amount: number): void {
    this.totalRetentionsFilied.inc(amount);
  }

  // Integration Metrics Methods
  recordIntegrationApiCall(service: string, endpoint: string, duration: number): void {
    this.integrationApiCalls.labels(service, endpoint).inc();
    this.integrationApiDuration.labels(service).observe(duration);
  }

  recordIntegrationApiError(service: string, errorCode: string): void {
    this.integrationApiErrors.labels(service, errorCode).inc();
  }

  // System Metrics Methods
  setActiveConnections(count: number): void {
    this.activeConnections.set(count);
  }

  setDatabaseConnections(count: number): void {
    this.databaseConnections.set(count);
  }

  updateProcessMetrics(): void {
    const uptime = process.uptime();
    const memUsage = process.memoryUsage().heapUsed;

    this.processUptime.set(uptime);
    this.memoryUsage.set(memUsage);

    // CPU usage approximation
    const usage = process.cpuUsage();
    const cpuPercent = (usage.user + usage.system) / 1000000;
    this.cpuUsage.set(cpuPercent);
  }

  // Security Metrics Methods
  recordFailedAuthentication(): void {
    this.failedAuthentications.inc();
  }

  recordUnauthorizedAccess(resource: string): void {
    this.unauthorizedAccess.labels(resource).inc();
  }

  recordSuspiciousActivity(type: string, severity: string): void {
    this.suspiciousActivities.labels(type, severity).inc();
  }

  // Get all metrics
  async getMetrics(): Promise<string> {
    return await this.register.metrics();
  }

  // Get summary
  getSummary(): Record<string, any> {
    return {
      timestamp: new Date().toISOString(),
      http: {
        totalRequests: 'See /metrics for details',
        avgResponseTime: 'See /metrics for details',
      },
      kyc: {
        totalVerifications: 'See /metrics for details',
        failedChecks: 'See /metrics for details',
        riskyClients: 'See /metrics for details',
      },
      segregation: {
        accountsCreated: 'See /metrics for details',
        transactionsRecorded: 'See /metrics for details',
        totalAUM: 'See /metrics for details',
        guaranteeFund: 'See /metrics for details',
      },
      tax: {
        reportsGenerated: 'See /metrics for details',
        reportsSubmitted: 'See /metrics for details',
      },
      security: {
        failedAuthentications: 'See /metrics for details',
        unauthorizedAccessAttempts: 'See /metrics for details',
        suspiciousActivities: 'See /metrics for details',
      },
      info: 'Use /monitoring/metrics for Prometheus format or /monitoring/dashboard for aggregated view',
    };
  }
}

export default new MetricsCollector();
