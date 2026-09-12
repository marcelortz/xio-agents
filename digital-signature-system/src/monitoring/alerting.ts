interface AlertRule {
  id: string;
  name: string;
  condition: (value: number) => boolean;
  threshold: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  enabled: boolean;
  cooldown: number; // ms between alerts
}

interface Alert {
  id: string;
  ruleId: string;
  ruleName: string;
  severity: string;
  metric: string;
  value: number;
  threshold: number;
  timestamp: string;
  message: string;
  acknowledged: boolean;
}

export class AlertingSystem {
  private alerts: Map<string, Alert> = new Map();
  private rules: Map<string, AlertRule> = new Map();
  private lastAlertTime: Map<string, number> = new Map();
  private subscribers: ((alert: Alert) => Promise<void>)[] = [];

  // Predefined Alert Rules
  private predefinedRules: AlertRule[] = [
    {
      id: 'high_risk_clients',
      name: 'High Risk Clients Alert',
      condition: (value) => value > 10,
      threshold: 10,
      severity: 'MEDIUM',
      enabled: true,
      cooldown: 300000, // 5 minutes
    },
    {
      id: 'aml_check_failures',
      name: 'AML Check Failures',
      condition: (value) => value > 5,
      threshold: 5,
      severity: 'HIGH',
      enabled: true,
      cooldown: 300000,
    },
    {
      id: 'failed_authentications',
      name: 'Failed Authentication Spike',
      condition: (value) => value > 10,
      threshold: 10,
      severity: 'HIGH',
      enabled: true,
      cooldown: 600000, // 10 minutes
    },
    {
      id: 'unauthorized_access',
      name: 'Unauthorized Access Attempts',
      condition: (value) => value > 5,
      threshold: 5,
      severity: 'CRITICAL',
      enabled: true,
      cooldown: 600000,
    },
    {
      id: 'integration_errors',
      name: 'Integration API Errors',
      condition: (value) => value > 3,
      threshold: 3,
      severity: 'MEDIUM',
      enabled: true,
      cooldown: 300000,
    },
    {
      id: 'database_connection_pool',
      name: 'Database Connection Pool Low',
      condition: (value) => value < 2,
      threshold: 2,
      severity: 'HIGH',
      enabled: true,
      cooldown: 600000,
    },
    {
      id: 'memory_usage',
      name: 'High Memory Usage',
      condition: (value) => value > 800 * 1024 * 1024, // 800MB
      threshold: 800 * 1024 * 1024,
      severity: 'MEDIUM',
      enabled: true,
      cooldown: 900000, // 15 minutes
    },
    {
      id: 'cpu_usage',
      name: 'High CPU Usage',
      condition: (value) => value > 80,
      threshold: 80,
      severity: 'MEDIUM',
      enabled: true,
      cooldown: 600000,
    },
    {
      id: 'tax_submission_failures',
      name: 'Tax Report Submission Failures',
      condition: (value) => value > 2,
      threshold: 2,
      severity: 'CRITICAL',
      enabled: true,
      cooldown: 600000,
    },
    {
      id: 'suspicious_activities',
      name: 'Suspicious Activity Spike',
      condition: (value) => value > 3,
      threshold: 3,
      severity: 'CRITICAL',
      enabled: true,
      cooldown: 300000,
    },
  ];

  constructor() {
    // Register predefined rules
    this.predefinedRules.forEach((rule) => {
      this.rules.set(rule.id, rule);
    });
  }

  // Subscribe to alerts
  subscribe(handler: (alert: Alert) => Promise<void>): void {
    this.subscribers.push(handler);
  }

  // Unsubscribe from alerts
  unsubscribe(handler: (alert: Alert) => Promise<void>): void {
    const index = this.subscribers.indexOf(handler);
    if (index > -1) {
      this.subscribers.splice(index, 1);
    }
  }

  // Evaluate metric against rules
  async evaluateMetric(metric: string, value: number): Promise<void> {
    for (const [ruleId, rule] of this.rules) {
      if (!rule.enabled) continue;

      if (rule.condition(value)) {
        await this.triggerAlert(rule, metric, value);
      }
    }
  }

  // Trigger an alert
  private async triggerAlert(
    rule: AlertRule,
    metric: string,
    value: number
  ): Promise<void> {
    const lastAlert = this.lastAlertTime.get(rule.id) || 0;
    const now = Date.now();

    // Check cooldown period
    if (now - lastAlert < rule.cooldown) {
      return;
    }

    const alert: Alert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`,
      ruleId: rule.id,
      ruleName: rule.name,
      severity: rule.severity,
      metric,
      value,
      threshold: rule.threshold,
      timestamp: new Date().toISOString(),
      message: this.generateAlertMessage(rule, metric, value),
      acknowledged: false,
    };

    this.alerts.set(alert.id, alert);
    this.lastAlertTime.set(rule.id, now);

    // Notify subscribers
    for (const subscriber of this.subscribers) {
      try {
        await subscriber(alert);
      } catch (error) {
        console.error('Alert subscriber error:', error);
      }
    }

    console.log(`🚨 [${alert.severity}] ${alert.message}`);
  }

  // Generate alert message
  private generateAlertMessage(
    rule: AlertRule,
    metric: string,
    value: number
  ): string {
    return `${rule.name}: ${metric} = ${value} (threshold: ${rule.threshold})`;
  }

  // Acknowledge alert
  acknowledgeAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.acknowledged = true;
      return true;
    }
    return false;
  }

  // Get active alerts
  getActiveAlerts(): Alert[] {
    return Array.from(this.alerts.values()).filter((a) => !a.acknowledged);
  }

  // Get all alerts
  getAllAlerts(): Alert[] {
    return Array.from(this.alerts.values());
  }

  // Get alert by ID
  getAlert(alertId: string): Alert | undefined {
    return this.alerts.get(alertId);
  }

  // Clear old alerts
  clearOldAlerts(ageMs: number = 24 * 60 * 60 * 1000): void {
    const cutoffTime = Date.now() - ageMs;
    for (const [alertId, alert] of this.alerts) {
      if (
        new Date(alert.timestamp).getTime() < cutoffTime &&
        alert.acknowledged
      ) {
        this.alerts.delete(alertId);
      }
    }
  }

  // Get alert statistics
  getAlertStatistics(): Record<string, any> {
    const alerts = Array.from(this.alerts.values());

    return {
      totalAlerts: alerts.length,
      activeAlerts: alerts.filter((a) => !a.acknowledged).length,
      acknowledgedAlerts: alerts.filter((a) => a.acknowledged).length,
      bySeverity: {
        CRITICAL: alerts.filter((a) => a.severity === 'CRITICAL').length,
        HIGH: alerts.filter((a) => a.severity === 'HIGH').length,
        MEDIUM: alerts.filter((a) => a.severity === 'MEDIUM').length,
        LOW: alerts.filter((a) => a.severity === 'LOW').length,
      },
      byRule: this.getAlertsByRule(alerts),
    };
  }

  // Get alerts grouped by rule
  private getAlertsByRule(alerts: Alert[]): Record<string, number> {
    const result: Record<string, number> = {};
    for (const alert of alerts) {
      result[alert.ruleName] = (result[alert.ruleName] || 0) + 1;
    }
    return result;
  }

  // Create custom rule
  addCustomRule(rule: AlertRule): void {
    this.rules.set(rule.id, rule);
  }

  // Disable rule
  disableRule(ruleId: string): boolean {
    const rule = this.rules.get(ruleId);
    if (rule) {
      rule.enabled = false;
      return true;
    }
    return false;
  }

  // Enable rule
  enableRule(ruleId: string): boolean {
    const rule = this.rules.get(ruleId);
    if (rule) {
      rule.enabled = true;
      return true;
    }
    return false;
  }

  // Get all rules
  getRules(): AlertRule[] {
    return Array.from(this.rules.values());
  }
}

export const alertingSystem = new AlertingSystem();
