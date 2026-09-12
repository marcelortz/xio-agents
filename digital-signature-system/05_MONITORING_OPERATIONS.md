# Phase 5: Monitoring & Operations Setup (4 Hours)

**Duration**: 4 hours  
**Prerequisites**: Phase 4 complete (system verified)  
**Status**: ✅ MONITORING & ALERTING SETUP

---

## Section A: Prometheus Installation (1 hour)

### Install Prometheus
```bash
# Create prometheus user
sudo useradd --no-create-home --shell /bin/false prometheus

# Create directories
sudo mkdir -p /etc/prometheus
sudo mkdir -p /var/lib/prometheus
sudo chown -R prometheus:prometheus /var/lib/prometheus

# Download Prometheus
cd /tmp
wget https://github.com/prometheus/prometheus/releases/download/v2.40.0/prometheus-2.40.0.linux-amd64.tar.gz
tar -xzf prometheus-2.40.0.linux-amd64.tar.gz
cd prometheus-2.40.0.linux-amd64

# Copy binaries
sudo cp prometheus /usr/local/bin/
sudo cp promtool /usr/local/bin/
sudo chown prometheus:prometheus /usr/local/bin/prometheus
sudo chown prometheus:prometheus /usr/local/bin/promtool

# Verify
prometheus --version
```
- [ ] Prometheus user created
- [ ] Directories created with correct permissions
- [ ] Prometheus binary installed
- [ ] promtool installed
- [ ] Version verified

### Create Prometheus Configuration
```bash
# Copy configuration file
sudo cp /opt/governance/prometheus/prometheus.yml /etc/prometheus/prometheus.yml

# Verify and edit if needed
sudo nano /etc/prometheus/prometheus.yml

# Required configuration:
# global:
#   scrape_interval: 15s
#   scrape_timeout: 10s
# scrape_configs:
#   - job_name: 'governance-api'
#     static_configs:
#       - targets: ['127.0.0.1:3001']
#     metrics_path: '/monitoring/metrics'

# Fix permissions
sudo chown prometheus:prometheus /etc/prometheus/prometheus.yml
sudo chown -R prometheus:prometheus /etc/prometheus

# Test configuration
sudo -u prometheus promtool check config /etc/prometheus/prometheus.yml
# Expected: syntax is valid
```
- [ ] prometheus.yml created
- [ ] Configuration syntax valid
- [ ] Scrape interval set (15s)
- [ ] Governance API configured as target
- [ ] Metrics path correct (/monitoring/metrics)

### Create Systemd Service for Prometheus
```bash
sudo tee /etc/systemd/system/prometheus.service << 'EOF'
[Unit]
Description=Prometheus
Wants=network-online.target
After=network-online.target

[Service]
User=prometheus
Group=prometheus
Type=simple
ExecStart=/usr/local/bin/prometheus \
  --config.file=/etc/prometheus/prometheus.yml \
  --storage.tsdb.path=/var/lib/prometheus/ \
  --web.console.templates=/etc/prometheus/consoles \
  --web.console.libraries=/etc/prometheus/console_libraries

Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Enable and start
sudo systemctl daemon-reload
sudo systemctl enable prometheus
sudo systemctl start prometheus

# Verify
sudo systemctl status prometheus
# Should show: active (running)
```
- [ ] Service file created
- [ ] Service enabled
- [ ] Service started
- [ ] Status shows "active (running)"

### Verify Prometheus
```bash
# Check if Prometheus is scraping metrics
sleep 5
curl -s http://localhost:9090/api/v1/targets | python3 -m json.tool | head -20

# Expected: targets should show HEALTHY state

# Check metrics collection
curl -s http://localhost:9090/api/v1/query?query=up | python3 -m json.tool
```
- [ ] Prometheus listening on port 9090
- [ ] Governance API target showing HEALTHY
- [ ] Metrics being scraped
- [ ] Data collected in Prometheus DB

---

## Section B: Alert Rules Configuration (1 hour)

### Create Alert Rules File
```bash
# Create alerting rules
sudo tee /etc/prometheus/alert-rules.yml << 'EOF'
groups:
  - name: governance
    interval: 30s
    rules:
      # CRITICAL: Service down
      - alert: ServiceDown
        expr: up{job="governance-api"} == 0
        for: 1m
        annotations:
          summary: "Governance API is down"
      
      # CRITICAL: Database connection lost
      - alert: DatabaseDown
        expr: pg_up == 0
        for: 1m
        annotations:
          summary: "PostgreSQL database is down"
      
      # CRITICAL: Redis connection lost
      - alert: RedisDown
        expr: redis_up == 0
        for: 1m
        annotations:
          summary: "Redis cache is down"
      
      # HIGH: High memory usage
      - alert: HighMemoryUsage
        expr: (process_resident_memory_bytes / (1024*1024)) > 800
        for: 5m
        annotations:
          summary: "Memory usage > 800MB"
      
      # HIGH: High CPU usage
      - alert: HighCPUUsage
        expr: rate(process_cpu_seconds_total[5m]) > 0.5
        for: 5m
        annotations:
          summary: "CPU usage > 50%"
      
      # HIGH: High response time
      - alert: HighResponseTime
        expr: histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m])) > 0.5
        for: 5m
        annotations:
          summary: "Response time > 500ms (p99)"
      
      # MEDIUM: High error rate
      - alert: HighErrorRate
        expr: rate(http_request_total{status=~"5.."}[5m]) > 0.01
        for: 5m
        annotations:
          summary: "Error rate > 1%"
      
      # MEDIUM: Database connection pool exhaustion
      - alert: DBConnectionPoolHigh
        expr: pg_stat_activity_count > 80
        for: 5m
        annotations:
          summary: "DB connections > 80"
      
      # MEDIUM: Disk space low
      - alert: DiskSpaceLow
        expr: (node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes) < 0.1
        for: 10m
        annotations:
          summary: "Disk space < 10%"
      
      # LOW: High transaction failure rate
      - alert: HighTransactionFailureRate
        expr: rate(transactions_failed_total[5m]) / rate(transactions_total[5m]) > 0.05
        for: 10m
        annotations:
          summary: "Transaction failure rate > 5%"
EOF

sudo chown prometheus:prometheus /etc/prometheus/alert-rules.yml

# Verify rules syntax
sudo -u prometheus promtool check rules /etc/prometheus/alert-rules.yml
# Expected: rules are valid
```
- [ ] Alert rules file created
- [ ] 10 alert rules defined
- [ ] Rules syntax valid
- [ ] CRITICAL/HIGH/MEDIUM severity levels defined

### Update Prometheus Configuration with Alert Rules
```bash
# Edit prometheus.yml to include alert rules
sudo nano /etc/prometheus/prometheus.yml

# Add this section:
# alerting:
#   alertmanagers:
#     - static_configs:
#         - targets:
#           - localhost:9093
#
# rule_files:
#   - "/etc/prometheus/alert-rules.yml"

# Reload Prometheus
sudo systemctl reload prometheus

# Wait a moment
sleep 2

# Verify rules loaded
curl -s http://localhost:9090/api/v1/rules | python3 -m json.tool | grep -A 2 "name"
```
- [ ] Alert rules configuration added
- [ ] Prometheus reloaded
- [ ] Rules loading successfully
- [ ] All 10 rules visible in Prometheus UI

---

## Section C: Grafana Installation & Dashboards (1.5 hours)

### Install Grafana
```bash
# Add Grafana repository
sudo apt-get install -y software-properties-common
sudo add-apt-repository "deb https://packages.grafana.com/oss/deb stable main"
wget -q -O - https://packages.grafana.com/gpg.key | sudo apt-key add -

# Install Grafana
sudo apt-get update
sudo apt-get install -y grafana-server

# Start service
sudo systemctl start grafana-server
sudo systemctl enable grafana-server

# Verify
sudo systemctl status grafana-server
# Should show: active (running)
```
- [ ] Grafana repository added
- [ ] Grafana installed
- [ ] Service started
- [ ] Service enabled on boot

### Access Grafana & Add Prometheus Data Source
```bash
# Grafana runs on port 3000 (use Nginx proxy if you want)
# Default credentials: admin / admin

# Via Nginx proxy:
curl -k -u admin:admin https://your-domain.com:3000/api/datasources

# Or directly:
curl -s -u admin:admin http://localhost:3000/api/datasources

# Add Prometheus as data source via API
curl -X POST -H "Content-Type: application/json" \
  -d '{
    "name":"Prometheus",
    "type":"prometheus",
    "url":"http://localhost:9090",
    "access":"proxy"
  }' \
  http://localhost:3000/api/datasources?apikey=YOUR_API_KEY

# Or manually via UI: Settings → Data Sources → Add Prometheus
```
- [ ] Grafana running on port 3000
- [ ] Default credentials working
- [ ] Prometheus data source added
- [ ] Data source connection verified

### Create Dashboards
```bash
# Dashboard 1: System Overview
# - CPU usage, Memory usage, Disk usage
# - Uptime, Request rate

# Dashboard 2: Application Performance
# - Response times (p50, p95, p99)
# - Error rate, Success rate
# - Request throughput

# Dashboard 3: Database Health
# - Connection count, Query time
# - Transaction rate, Replication lag
# - Disk usage

# Dashboard 4: Security & Compliance
# - Failed auth attempts, OTP rate
# - Transaction audit log rate
# - Regulatory report status

# Import or create dashboards via Grafana UI
```
- [ ] Dashboard 1: System Overview created
- [ ] Dashboard 2: Application Performance created
- [ ] Dashboard 3: Database Health created
- [ ] Dashboard 4: Security & Compliance created
- [ ] Dashboards showing live data

---

## Section D: Alert Notification Channels (45 minutes)

### Setup Email Alerts
```bash
# Install AlertManager (for advanced alerting)
cd /tmp
wget https://github.com/prometheus/alertmanager/releases/download/v0.24.0/alertmanager-0.24.0.linux-amd64.tar.gz
tar -xzf alertmanager-0.24.0.linux-amd64.tar.gz
cd alertmanager-0.24.0.linux-amd64

# Install
sudo cp alertmanager /usr/local/bin/
sudo cp amtool /usr/local/bin/

# Create config
sudo tee /etc/alertmanager/config.yml << 'EOF'
global:
  resolve_timeout: 5m

route:
  receiver: 'ops-team'
  group_by: ['alertname']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 4h

receivers:
  - name: 'ops-team'
    email_configs:
      - to: 'ops@company.ec'
        from: 'alerts@company.ec'
        smarthost: 'smtp.gmail.com:587'
        auth_username: 'YOUR_EMAIL'
        auth_password: 'YOUR_PASSWORD'
        headers:
          Subject: '[ALERT] {{ .GroupLabels.alertname }}'
EOF

sudo mkdir -p /etc/alertmanager
sudo chown -R alertmanager:alertmanager /etc/alertmanager
```
- [ ] AlertManager installed
- [ ] Email configuration created
- [ ] SMTP settings configured
- [ ] Test email sent successfully

### Configure Slack Alerts (Optional)
```bash
# In AlertManager config, add:
# - name: 'ops-slack'
#   slack_configs:
#     - api_url: 'YOUR_SLACK_WEBHOOK_URL'
#       channel: '#alerts'
#       text: 'Alert: {{ .GroupLabels.alertname }}'

# Or configure via Grafana UI directly
# Administration → Notification Channels → New Channel
# - Type: Slack
# - Webhook URL: <your-webhook>
# - Channel: #alerts
```
- [ ] Slack webhook URL obtained
- [ ] Slack channel configured
- [ ] Test alert sent to Slack

### Configure PagerDuty Alerts (Optional)
```bash
# In Grafana: Administration → Notification Channels → New Channel
# - Type: PagerDuty
# - Integration Key: <your-key>
# - For: CRITICAL and HIGH severity

# Or via AlertManager config:
# - name: 'ops-pagerduty'
#   pagerduty_configs:
#     - service_key: 'YOUR_SERVICE_KEY'
```
- [ ] PagerDuty integration key obtained
- [ ] PagerDuty channel configured
- [ ] Test alert sent to PagerDuty

---

## Section E: Logging Configuration (30 minutes)

### Application Logging
```bash
# Verify application logging to systemd journal
journalctl -u governance-api | head -20

# Persistent logging should be enabled
sudo nano /etc/systemd/journald.conf
# Set: Storage=persistent

# Restart journald
sudo systemctl restart systemd-journald

# Verify logs are persistent
ls -la /var/log/journal/
```
- [ ] Application logging to systemd journal
- [ ] Journal storage set to persistent
- [ ] Logs are persistent across reboots
- [ ] Log rotation configured

### Log Forwarding (Optional)
```bash
# If using centralized logging, configure forwarding
# Example: ELK, Splunk, CloudWatch, etc.

# For basic centralized logging with rsyslog:
sudo tee /etc/rsyslog.d/99-governance.conf << 'EOF'
:programname, isequal, "node" @@@localhost:514
EOF

sudo systemctl restart rsyslog
```
- [ ] Log forwarding configured (if using)
- [ ] Logs being forwarded to central system
- [ ] Remote log collection verified

---

## Section F: Backup Configuration (15 minutes)

### Automated Database Backups
```bash
# Create backup script
sudo tee /opt/governance/scripts/backup-database.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backups"
DB_NAME="xio_governance"
DB_USER="xio_user"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="$BACKUP_DIR/db-backup-$TIMESTAMP.sql.gz"

echo "Starting backup at $(date)" >> /var/log/governance/backup.log

PGPASSWORD=$DB_PASSWORD pg_dump -h localhost -U $DB_USER $DB_NAME | gzip > $BACKUP_FILE

if [ $? -eq 0 ]; then
    echo "✓ Backup successful: $BACKUP_FILE" >> /var/log/governance/backup.log
    # Keep only last 30 days of backups
    find $BACKUP_DIR -name "db-backup-*.sql.gz" -mtime +30 -delete
else
    echo "✗ Backup failed at $(date)" >> /var/log/governance/backup.log
    exit 1
fi
EOF

sudo chmod +x /opt/governance/scripts/backup-database.sh
```
- [ ] Backup script created
- [ ] Script executable
- [ ] Backup location set (/backups)
- [ ] Log file configured

### Schedule Daily Backups
```bash
# Add to crontab
sudo -u app crontab -e

# Add line:
# 0 2 * * * /opt/governance/scripts/backup-database.sh

# Or edit as root:
sudo tee /etc/cron.daily/governance-backup << 'EOF'
#!/bin/bash
/opt/governance/scripts/backup-database.sh
EOF

sudo chmod +x /etc/cron.daily/governance-backup
```
- [ ] Backup cron job added
- [ ] Scheduled for 2 AM daily
- [ ] Backup script executable
- [ ] Retention policy set (30 days)

---

## Section G: Monitoring Dashboard Walkthrough

### Key Metrics to Monitor Daily
```
System:
├─ CPU Usage (< 50%)
├─ Memory Usage (< 1GB / 4-8GB available)
├─ Disk Usage (> 10% free)
└─ Uptime (> 99.9%)

Application:
├─ Request Rate (requests/second)
├─ Response Time (p50, p95, p99)
├─ Error Rate (< 1%)
└─ Active Users/Sessions

Database:
├─ Connection Count (< 100)
├─ Query Latency (< 100ms)
├─ Transaction Rate (transactions/sec)
└─ Replication Lag (if HA)

Security:
├─ Failed Auth Attempts
├─ OTP Generation Rate
├─ Audit Log Entries
└─ Compliance Status
```

### Dashboard Checks
- [ ] System Overview dashboard created
- [ ] Application Performance dashboard created
- [ ] Database Health dashboard created
- [ ] Security & Compliance dashboard created
- [ ] All dashboards showing live data
- [ ] All metrics updating (not stale)

---

## Section H: Monitoring Sign-Off

### Monitoring Setup Checklist
- [ ] Prometheus installed and running
- [ ] Alert rules configured (10 rules)
- [ ] Grafana installed and running
- [ ] 4 Grafana dashboards created
- [ ] Prometheus data source connected
- [ ] Email alerting configured
- [ ] Slack alerting configured (optional)
- [ ] PagerDuty alerting configured (optional)
- [ ] Application logging configured
- [ ] Backup script created and scheduled
- [ ] Backup runs daily at 2 AM
- [ ] All metrics collecting successfully
- [ ] Dashboards showing live data
- [ ] Alerts tested and working

### Sign-Off

- [ ] Monitoring Engineer: _________________________ Date: _______
- [ ] Operations Lead: _________________________ Date: _______
- [ ] Security Officer: _________________________ Date: _______

**Monitoring & Operations Setup Status**: ✅ **READY FOR GO-LIVE**

---

## Dashboard Access URLs

```
Prometheus: https://your-domain.com/prometheus
Grafana: https://your-domain.com/grafana
AlertManager: https://your-domain.com/alertmanager

Or directly (if exposed):
Prometheus: http://localhost:9090
Grafana: http://localhost:3000 (admin/admin)
AlertManager: http://localhost:9093
```

---

## Next Steps

### Immediate
1. All monitoring services running
2. All dashboards active
3. Alert channels tested

### Phase 6 (Next - Go-Live)
1. Final health checks
2. Update DNS / load balancer
3. Activate on-call rotation
4. Send go-live notification

🔄 **Estimated Phase 6 Duration**: 4 hours

---

**Phase 5 Complete**: ✅ Monitoring and alerting fully operational  
**Total Elapsed Time**: ~14 hours (Phases 1-5)  
**Next Phase**: 06_GO_LIVE_CHECKLIST.md
