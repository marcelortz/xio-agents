import { Request, Response, NextFunction } from 'express';
import metricsCollector from './metrics-collector';
import logger from './logger';
import { alertingSystem } from './alerting';

export interface MonitoringContext {
  traceId: string;
  spanId: string;
  startTime: number;
}

// Store context in request
declare global {
  namespace Express {
    interface Request {
      monitoring?: MonitoringContext;
    }
  }
}

export class MonitoringMiddleware {
  static requestTracker(): (req: Request, res: Response, next: NextFunction) => void {
    return (req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now();
      const endpoint = req.path;
      const method = req.method;

      // Generate tracing IDs
      const traceId =
        req.headers['x-trace-id'] ||
        `trace-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;
      const spanId = `span-${Math.random().toString(36).substring(7).toUpperCase()}`;

      // Attach monitoring context to request
      req.monitoring = {
        traceId: String(traceId),
        spanId,
        startTime,
      };

      // Log incoming request
      logger.info('request_received', `${method} ${endpoint}`, {
        traceId: req.monitoring.traceId,
        spanId: req.monitoring.spanId,
        method,
        path: endpoint,
        ip: req.ip,
        userAgent: req.get('user-agent'),
      });

      // Capture response
      const originalSend = res.send;
      let responseBody = '';

      res.send = function (data: any): Response {
        responseBody = typeof data === 'string' ? data : JSON.stringify(data);
        return originalSend.call(this, data);
      };

      // Record metrics when response is sent
      res.on('finish', () => {
        const duration = Date.now() - startTime;
        const status = res.statusCode;

        // Record HTTP metrics
        metricsCollector.recordHttpRequest(
          endpoint,
          method,
          status,
          duration / 1000, // convert to seconds
          JSON.stringify(req.body || {}).length,
          responseBody.length || 0
        );

        // Log response
        logger.info('request_completed', `${method} ${endpoint}`, {
          traceId: req.monitoring?.traceId,
          spanId: req.monitoring?.spanId,
          status,
          duration,
          endpoint,
          method,
        });

        // Evaluate performance metrics
        if (duration > 5000) {
          logger.warn('slow_request_detected', `Request took ${duration}ms`, {
            traceId: req.monitoring?.traceId,
            spanId: req.monitoring?.spanId,
            endpoint,
            duration,
          });
        }
      });

      // Handle errors
      res.on('error', (error) => {
        logger.error('response_error', `Error in ${method} ${endpoint}`, error, {
          traceId: req.monitoring?.traceId,
          spanId: req.monitoring?.spanId,
          endpoint,
          method,
        });
      });

      next();
    };
  }

  static errorHandler(): (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
  ) => void {
    return (err: Error, req: Request, res: Response, next: NextFunction) => {
      const status = (err as any).status || 500;
      const message = err.message || 'Internal Server Error';

      logger.error('api_error', message, err, {
        traceId: req.monitoring?.traceId,
        spanId: req.monitoring?.spanId,
        path: req.path,
        method: req.method,
        status,
      });

      // Record error metric
      metricsCollector.recordHttpRequest(
        req.path,
        req.method,
        status,
        (Date.now() - (req.monitoring?.startTime || Date.now())) / 1000,
        0,
        0
      );

      // Evaluate alert conditions
      alertingSystem.evaluateMetric('api_errors', 1);

      res.status(status).json({
        error: message,
        traceId: req.monitoring?.traceId,
        spanId: req.monitoring?.spanId,
      });
    };
  }

  static metricsReporter(): (
    req: Request,
    res: Response,
    next: NextFunction
  ) => void {
    return (req: Request, res: Response, next: NextFunction) => {
      // Update process metrics periodically
      if (Math.random() < 0.1) {
        // 10% of requests
        metricsCollector.updateProcessMetrics();
      }

      next();
    };
  }

  static kyc_amlMonitor(): (
    req: Request,
    res: Response,
    next: NextFunction
  ) => void {
    return (req: Request, res: Response, next: NextFunction) => {
      // Track KYC/AML operations
      if (req.path.startsWith('/kyc-aml')) {
        const operation = req.path.split('/').pop();

        res.on('finish', async () => {
          if (res.statusCode === 200) {
            if (operation === 'register' || operation === 'verify-kyc') {
              metricsCollector.recordKYCVerification('success');
            }
          } else if (res.statusCode === 400) {
            metricsCollector.recordKYCVerification('failed');
            metricsCollector.recordAMLCheckFailed('validation_error');

            // Evaluate alert
            alertingSystem.evaluateMetric('aml_check_failures', 1);
          }
        });
      }

      next();
    };
  }

  static segregationMonitor(): (
    req: Request,
    res: Response,
    next: NextFunction
  ) => void {
    return (req: Request, res: Response, next: NextFunction) => {
      // Track account segregation operations
      if (req.path.startsWith('/segregation')) {
        const operation = req.path.split('/').pop();

        res.on('finish', async () => {
          if (res.statusCode === 201 && operation === 'create-account') {
            const accountType = (req.body as any)?.type || 'unknown';
            metricsCollector.recordAccountCreated(accountType);
          } else if (
            res.statusCode === 200 &&
            operation === 'record-transaction'
          ) {
            const txType = (req.body as any)?.type || 'unknown';
            const status = (req.body as any)?.status || 'recorded';
            metricsCollector.recordTransactionRecorded(txType, status);
          }
        });
      }

      next();
    };
  }

  static taxMonitor(): (
    req: Request,
    res: Response,
    next: NextFunction
  ) => void {
    return (req: Request, res: Response, next: NextFunction) => {
      // Track tax operations
      if (req.path.startsWith('/tax')) {
        res.on('finish', async () => {
          if (res.statusCode === 200) {
            if (req.path.includes('generate-report')) {
              metricsCollector.recordTaxReportGenerated();
            } else if (req.path.includes('report-to-sri')) {
              metricsCollector.recordTaxReportSubmitted('success');
            }
          } else if (res.statusCode >= 400) {
            if (req.path.includes('report-to-sri')) {
              metricsCollector.recordTaxReportSubmitted('failed');

              // Evaluate alert
              alertingSystem.evaluateMetric('tax_submission_failures', 1);
            }
          }
        });
      }

      next();
    };
  }

  static integrationMonitor(): (
    req: Request,
    res: Response,
    next: NextFunction
  ) => void {
    return (req: Request, res: Response, next: NextFunction) => {
      // Track external API calls
      if (req.path.startsWith('/integrations')) {
        const service = (req.body as any)?.service || 'unknown';

        const startTime = Date.now();

        res.on('finish', async () => {
          const duration = (Date.now() - startTime) / 1000;

          if (res.statusCode === 200) {
            metricsCollector.recordIntegrationApiCall(service, req.path, duration);
          } else {
            const errorCode = String(res.statusCode);
            metricsCollector.recordIntegrationApiError(service, errorCode);

            // Evaluate alert
            alertingSystem.evaluateMetric('integration_errors', 1);
          }
        });
      }

      next();
    };
  }

  static securityMonitor(): (
    req: Request,
    res: Response,
    next: NextFunction
  ) => void {
    return (req: Request, res: Response, next: NextFunction) => {
      // Track security-related events
      if (req.path.includes('login') || req.path.includes('auth')) {
        res.on('finish', async () => {
          if (res.statusCode === 401 || res.statusCode === 403) {
            if (res.statusCode === 401) {
              metricsCollector.recordFailedAuthentication();
              alertingSystem.evaluateMetric('failed_authentications', 1);
            } else {
              metricsCollector.recordUnauthorizedAccess(req.path);
              alertingSystem.evaluateMetric('unauthorized_access', 1);
            }
          }
        });
      }

      next();
    };
  }
}

export default MonitoringMiddleware;
