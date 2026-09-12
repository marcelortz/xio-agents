import { Router, Request, Response } from 'express';
import metricsCollector from '../monitoring/metrics-collector';
import logger from '../monitoring/logger';
import { alertingSystem } from '../monitoring/alerting';

const router = Router();

// GET /metrics - Prometheus-compatible metrics
router.get('/metrics', async (req: Request, res: Response) => {
  try {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    const metrics = await metricsCollector.getMetrics();
    res.send(metrics);
  } catch (error: any) {
    logger.error('metrics_export', 'Failed to export metrics', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /metrics/summary - Human-readable metrics summary
router.get('/metrics/summary', async (req: Request, res: Response) => {
  try {
    res.json({
      timestamp: new Date().toISOString(),
      info: 'Metrics are available in Prometheus format at /monitoring/metrics',
      endpoints: {
        prometheus: '/monitoring/metrics',
        dashboard: '/monitoring/dashboard',
        alerts: '/monitoring/alerts',
        compliance: '/monitoring/compliance-report',
      },
    });
  } catch (error: any) {
    logger.error('metrics_summary', 'Failed to generate summary', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /health - Health check
router.get('/health', async (req: Request, res: Response) => {
  try {
    const summary = metricsCollector.getSummary();

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      metrics: {
        activeAlerts: alertingSystem.getActiveAlerts().length,
        totalMetrics: Object.keys(summary).length,
      },
    });
  } catch (error: any) {
    logger.error('health_check', 'Health check failed', error);
    res.status(503).json({ status: 'unhealthy', error: error.message });
  }
});

// GET /alert-statistics - Alert statistics
router.get('/alert-statistics', async (req: Request, res: Response) => {
  try {
    const stats = alertingSystem.getAlertStatistics();

    res.json({
      timestamp: new Date().toISOString(),
      ...stats,
    });
  } catch (error: any) {
    logger.error('alert_statistics', 'Failed to get alert statistics', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /alert-rules - List alert rules
router.get('/alert-rules', async (req: Request, res: Response) => {
  try {
    const rules = alertingSystem.getRules();

    res.json({
      total: rules.length,
      rules,
    });
  } catch (error: any) {
    logger.error('alert_rules', 'Failed to list alert rules', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /alerts/rules/:id/enable - Enable alert rule
router.post('/alerts/rules/:id/enable', async (req: Request, res: Response) => {
  try {
    const success = alertingSystem.enableRule(req.params.id);

    if (!success) {
      return res.status(404).json({ error: 'Rule not found' });
    }

    await logger.info('rule_enabled', `Rule ${req.params.id} enabled`, {
      ruleId: req.params.id,
    });

    res.json({
      success: true,
      message: 'Rule enabled',
    });
  } catch (error: any) {
    logger.error('rule_enable', 'Failed to enable rule', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /alerts/rules/:id/disable - Disable alert rule
router.post('/alerts/rules/:id/disable', async (req: Request, res: Response) => {
  try {
    const success = alertingSystem.disableRule(req.params.id);

    if (!success) {
      return res.status(404).json({ error: 'Rule not found' });
    }

    await logger.info('rule_disabled', `Rule ${req.params.id} disabled`, {
      ruleId: req.params.id,
    });

    res.json({
      success: true,
      message: 'Rule disabled',
    });
  } catch (error: any) {
    logger.error('rule_disable', 'Failed to disable rule', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /alerts - List all alerts
router.get('/alerts', async (req: Request, res: Response) => {
  try {
    const filter = req.query.filter as string | undefined;

    let alerts = alertingSystem.getAllAlerts();

    if (filter === 'active') {
      alerts = alertingSystem.getActiveAlerts();
    }

    res.json({
      total: alerts.length,
      alerts,
    });
  } catch (error: any) {
    logger.error('alerts_list', 'Failed to list alerts', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /alerts/:id - Get alert details
router.get('/alerts/:id', async (req: Request, res: Response) => {
  try {
    const alert = alertingSystem.getAlert(req.params.id);

    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    res.json(alert);
  } catch (error: any) {
    logger.error('alert_detail', 'Failed to get alert', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /alerts/:id/acknowledge - Acknowledge alert
router.post('/alerts/:id/acknowledge', async (req: Request, res: Response) => {
  try {
    const success = alertingSystem.acknowledgeAlert(req.params.id);

    if (!success) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    await logger.info('alert_acknowledged', `Alert ${req.params.id} acknowledged`, {
      alertId: req.params.id,
    });

    res.json({
      success: true,
      message: 'Alert acknowledged',
    });
  } catch (error: any) {
    logger.error('alert_acknowledge', 'Failed to acknowledge alert', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /logs - Get logs
router.get('/logs', async (req: Request, res: Response) => {
  try {
    const date = req.query.date as string | undefined;
    const limit = parseInt(req.query.limit as string || '100');

    const logBuffer = logger.getLogBuffer();
    const logs = logBuffer.slice(-limit);

    res.json({
      total: logBuffer.length,
      returned: logs.length,
      logs,
    });
  } catch (error: any) {
    logger.error('logs_retrieve', 'Failed to retrieve logs', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /dashboard - Dashboard data (aggregated view)
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const alertStats = alertingSystem.getAlertStatistics();
    const activeAlerts = alertingSystem.getActiveAlerts();

    res.json({
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        heapUsed: process.memoryUsage().heapUsed,
        heapTotal: process.memoryUsage().heapTotal,
      },
      cpu: {
        user: process.cpuUsage().user,
        system: process.cpuUsage().system,
      },
      metrics: {
        info: 'Detailed metrics available at /monitoring/metrics (Prometheus format)',
        endpoints: {
          prometheus: '/monitoring/metrics',
          alerts: '/monitoring/alerts',
          compliance: '/monitoring/compliance-report',
        },
      },
      alerts: {
        ...alertStats,
        recent: activeAlerts.slice(0, 10),
      },
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        uptime: process.uptime(),
      },
    });
  } catch (error: any) {
    logger.error('dashboard', 'Failed to generate dashboard', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /compliance-report - Compliance report
router.get('/compliance-report', async (req: Request, res: Response) => {
  try {
    const alertStats = alertingSystem.getAlertStatistics();

    res.json({
      timestamp: new Date().toISOString(),
      compliance: {
        kyc: {
          info: 'KYC metrics tracked via /monitoring/metrics',
          endpoint: '/compliance/kyc/*',
        },
        segregation: {
          info: 'Segregation metrics tracked via /monitoring/metrics',
          endpoint: '/segregation/*',
        },
        tax: {
          info: 'Tax metrics tracked via /monitoring/metrics',
          endpoint: '/tax/*',
        },
        security: {
          info: 'Security metrics tracked automatically',
          monitored: ['failed_authentications', 'unauthorized_access', 'suspicious_activities'],
        },
      },
      alerts: alertStats,
      metricsAvailable: {
        prometheus: '/monitoring/metrics',
        dashboard: '/monitoring/dashboard',
      },
    });
  } catch (error: any) {
    logger.error('compliance_report', 'Failed to generate compliance report', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
