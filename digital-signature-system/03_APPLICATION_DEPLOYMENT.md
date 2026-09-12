# Phase 3: Application Deployment (2 Hours)

**Duration**: 2 hours  
**Prerequisites**: Phase 2 complete (infrastructure running)  
**Status**: ✅ APPLICATION DEPLOYMENT

---

## Section A: Pre-Deployment Backup (15 minutes)

### Database Backup Before Deployment
```bash
# Create pre-deployment backup
sudo -u postgres pg_dump xio_governance | gzip > /backups/pre-deployment-backup.sql.gz

# Verify backup
gunzip -c /backups/pre-deployment-backup.sql.gz | head -5

# Record backup info
ls -lh /backups/pre-deployment-backup.sql.gz
echo "Pre-deployment backup created: $(date)" >> /var/log/governance/deployment.log
```
- [ ] Database backup created
- [ ] Backup verified
- [ ] Backup location recorded

### Rollback Plan Prepared
```bash
# Verify rollback script exists
ls -l /opt/governance/scripts/rollback.sh

# Test rollback script syntax (dry-run)
bash -n /opt/governance/scripts/rollback.sh
# Should show: no errors
```
- [ ] Rollback script verified
- [ ] Rollback plan documented
- [ ] Emergency procedures reviewed

---

## Section B: File Transfer (30 minutes)

### Option 1: SCP (Secure Copy)
```bash
# On deployment/build machine:
scp -r governance-system-prod.tar.gz app@your-server:/tmp/

# On production server:
sudo mv /tmp/governance-system-prod.tar.gz /opt/
cd /opt
sudo tar -xzf governance-system-prod.tar.gz
sudo chown -R app:app governance
```

### Option 2: Direct Git Clone
```bash
# On production server:
cd /opt/governance
sudo -u app git clone --depth 1 https://github.com/marcelortz/xio-agents-2b.git .
sudo -u app git checkout v1.0.0-prod  # Specific tag/release
```

### Verify Files Transferred
```bash
# Check directory structure
ls -la /opt/governance/
# Should show: dist/, src/, package.json, keys/, etc.

# Verify key files exist
test -f /opt/governance/dist/server.js && echo "✓ server.js exists" || echo "✗ Missing"
test -f /opt/governance/package.json && echo "✓ package.json exists" || echo "✗ Missing"
test -d /opt/governance/keys && echo "✓ keys dir exists" || echo "✗ Missing"

# Check disk usage
du -sh /opt/governance
# Should be: ~100-200MB
```
- [ ] Files transferred to server
- [ ] Directory structure intact
- [ ] All critical files present
- [ ] Disk space adequate

---

## Section C: Environment Configuration (15 minutes)

### Create .env.production
```bash
# Copy template
sudo -u app cp /opt/governance/.env.production.template /opt/governance/.env.production

# Edit with actual values
sudo -u app nano /opt/governance/.env.production

# Required settings:
NODE_ENV=production
PORT=3001
LOG_LEVEL=info

DB_HOST=localhost
DB_PORT=5432
DB_NAME=xio_governance
DB_USER=xio_user
DB_PASSWORD=<FROM_PHASE_2>

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=<FROM_PHASE_2>

JWT_SECRET=<GENERATE_STRONG_SECRET>
RSA_KEY_PATH=/opt/governance/keys
```

### Verify Configuration
```bash
# Check file exists and is readable
test -f /opt/governance/.env.production && echo "✓ .env.production exists" || echo "✗ Missing"

# Verify permissions (should not be world-readable)
ls -l /opt/governance/.env.production
# Should show: -rw-r--r-- app app (or 600)

# Verify critical variables set
grep "^DB_PASSWORD=" /opt/governance/.env.production && echo "✓ DB configured" || echo "✗ Missing DB_PASSWORD"
grep "^REDIS_PASSWORD=" /opt/governance/.env.production && echo "✓ Redis configured" || echo "✗ Missing REDIS_PASSWORD"
grep "^JWT_SECRET=" /opt/governance/.env.production && echo "✓ JWT configured" || echo "✗ Missing JWT_SECRET"
```
- [ ] .env.production created
- [ ] All required variables set
- [ ] Permissions secured (600)
- [ ] File readable by app user

---

## Section D: Dependency Installation (20 minutes)

### Install Production Dependencies
```bash
# Switch to app user
sudo -u app bash << 'EOF'
cd /opt/governance

# Install production dependencies only
npm install --production

# Verify installation
npm list
EOF

# Check critical packages
grep -E "express|pg|redis|prom-client" /opt/governance/package.json
```
- [ ] npm install completed successfully
- [ ] No errors in output
- [ ] node_modules directory created
- [ ] All 15 critical packages installed

### Verify Dependencies
```bash
# Check specific critical dependencies
ls -la /opt/governance/node_modules/ | grep -E "express|pg|redis"

# Verify package count
ls /opt/governance/node_modules/ | wc -l
# Should be: 50-100 packages (with dependencies)

# Test require paths
sudo -u app node -e "require('express'); require('pg'); require('redis'); console.log('✓ All dependencies loadable')"
```
- [ ] node_modules directory exists
- [ ] All critical packages present
- [ ] All dependencies loadable (no errors)

---

## Section E: Database Migrations (15 minutes)

### Run Database Schema
```bash
# The schema should be in the package
# If using database migration script:

sudo -u app bash << 'EOF'
cd /opt/governance

# Option 1: Direct SQL import (if schema.sql exists)
PGPASSWORD=$DB_PASSWORD psql -h localhost -U xio_user -d xio_governance -f schema.sql 2>&1

# Option 2: Run migrations from app
# npm run migrate:prod

# Verify database created tables
PGPASSWORD=$DB_PASSWORD psql -h localhost -U xio_user -d xio_governance -c "\dt"
EOF
```
- [ ] Database schema created
- [ ] All 11 tables created:
  - [ ] clients
  - [ ] transactions
  - [ ] audit_logs
  - [ ] otp_codes
  - [ ] digital_signatures
  - [ ] segregated_accounts
  - [ ] account_balance
  - [ ] tax_reports
  - [ ] kyc_verifications
  - [ ] aml_flags
  - [ ] monitoring_metrics

### Verify Database Content
```bash
# Check table count
PGPASSWORD=YOUR_PASSWORD psql -h localhost -U xio_user -d xio_governance -c "SELECT schemaname, tablename FROM pg_tables WHERE schemaname != 'pg_catalog' AND schemaname != 'information_schema';"

# Should show: 11 tables
```
- [ ] All tables created
- [ ] Tables are empty (ready for data)
- [ ] Database ready for operations

---

## Section F: Service Configuration (15 minutes)

### Setup Systemd Service
```bash
# Copy service file
sudo cp /opt/governance/systemd/governance-api.service /etc/systemd/system/

# Edit if needed
sudo nano /etc/systemd/system/governance-api.service

# Verify content:
# [Unit]
# Description=Digital Governance API
# After=network.target postgresql.service redis.service
#
# [Service]
# Type=simple
# User=app
# WorkingDirectory=/opt/governance
# EnvironmentFile=/opt/governance/.env.production
# ExecStart=/usr/bin/node dist/server.js
# Restart=on-failure
# RestartSec=10
# StandardOutput=journal
# StandardError=journal
#
# [Install]
# WantedBy=multi-user.target

# Reload systemd
sudo systemctl daemon-reload
sudo systemctl enable governance-api

# Verify service file
sudo systemctl cat governance-api | head -20
```
- [ ] Service file copied
- [ ] Service file correct
- [ ] Service registered with systemd
- [ ] Service set to auto-start

---

## Section G: Start Application (10 minutes)

### Start the Service
```bash
# Start application
sudo systemctl start governance-api

# Check status
sudo systemctl status governance-api
# Should show: active (running)

# Wait for startup
sleep 5

# Check service running
sudo systemctl is-active governance-api
# Expected output: active
```
- [ ] Service started successfully
- [ ] Service status shows "active (running)"
- [ ] No startup errors

### View Startup Logs
```bash
# Check for any startup issues
journalctl -u governance-api -n 50

# Look for:
# ✓ "Server listening on port 3001"
# ✓ "Database connected"
# ✓ "Redis connected"
# ✗ Avoid: "Error", "FATAL", "Cannot find module"

# Full tail (Ctrl+C to exit)
journalctl -u governance-api -f
```
- [ ] Server listening on port 3001
- [ ] Database connected
- [ ] Redis connected
- [ ] No errors in startup logs

### Verify Port Listening
```bash
# Check if port 3001 is listening
netstat -tuln | grep 3001
# Expected: tcp 127.0.0.1:3001 LISTEN

# Or use ss
ss -tuln | grep 3001
# Expected: tcp LISTEN 127.0.0.1:3001
```
- [ ] Port 3001 is listening
- [ ] Port bound to localhost only (not world-accessible)

---

## Section H: Reverse Proxy Verification (10 minutes)

### Test Nginx Reverse Proxy
```bash
# Test through Nginx (HTTPS)
curl -k https://localhost/api/health

# Test through Nginx with domain
curl -k https://your-domain.com/api/health

# Expected response:
# {"status":"healthy","timestamp":"2026-09-12T..."}
```
- [ ] Nginx forwarding requests correctly
- [ ] HTTPS working
- [ ] Application responding through proxy

### Verify No Direct Access
```bash
# Direct access should be blocked
curl http://localhost:3001/api/health || echo "✓ Direct access blocked (expected)"

# This should timeout or fail (port 3001 not exposed)
```
- [ ] Direct port 3001 access blocked by firewall
- [ ] Users must go through Nginx/HTTPS

---

## Section I: Application Verification (10 minutes)

### Basic Connectivity Tests
```bash
# Test main application endpoint
curl -k -s https://localhost/ | head -20

# Test health check
curl -k -s https://localhost/monitoring/health | python3 -m json.tool

# Expected:
# {
#   "status": "healthy",
#   "database": "connected",
#   "redis": "connected",
#   "timestamp": "..."
# }
```
- [ ] Application responding to requests
- [ ] Health check returning healthy status
- [ ] Database connection confirmed
- [ ] Redis connection confirmed

### Log File Verification
```bash
# Check application logs
journalctl -u governance-api | tail -30

# Look for:
# ✓ "Server listening on port 3001"
# ✓ "PostgreSQL pool ready"
# ✓ "Redis client ready"
# ✗ No errors or warnings

# Check system logs
sudo tail -20 /var/log/syslog | grep governance
```
- [ ] Startup logs show "listening on port 3001"
- [ ] Database pool initialized
- [ ] Redis client initialized
- [ ] No critical errors in logs

---

## Section J: Automatic Restart Verification (5 minutes)

### Test Auto-Restart Behavior
```bash
# Note the PID
PID=$(systemctl show -p MainPID --value governance-api)
echo "Current PID: $PID"

# Stop the service
sudo systemctl kill governance-api

# Wait 12 seconds (service restarts after 10 seconds)
sleep 12

# Verify it restarted
NEW_PID=$(systemctl show -p MainPID --value governance-api)
echo "New PID: $NEW_PID"

# They should be different
if [ "$PID" != "$NEW_PID" ]; then
    echo "✓ Auto-restart working"
else
    echo "✗ Auto-restart failed"
fi

# Verify service still running
sudo systemctl status governance-api
```
- [ ] Service restarted automatically
- [ ] New PID assigned
- [ ] Service running after restart

---

## Section K: Deployment Sign-Off

### Deployment Verification Checklist
- [ ] Files transferred successfully
- [ ] .env.production configured with all secrets
- [ ] Dependencies installed (npm install completed)
- [ ] Database schema created (11 tables)
- [ ] Systemd service configured and enabled
- [ ] Application service started and running
- [ ] Application listening on port 3001
- [ ] Nginx reverse proxy forwarding requests
- [ ] Health check returning "healthy"
- [ ] Database connection verified
- [ ] Redis connection verified
- [ ] Auto-restart tested and working
- [ ] No startup errors in logs

### Sign-Off

- [ ] Operations Engineer: _________________________ Date: _______
- [ ] Database Admin: _________________________ Date: _______
- [ ] DevOps Lead: _________________________ Date: _______

**Application Deployment Status**: ✅ **READY FOR VERIFICATION**

---

## Next Steps

### Immediate
1. Application running and responding
2. All services initialized
3. No critical errors

### Phase 4 (Next - Verification)
1. Run health checks
2. Execute 12-step integration test
3. Verify all endpoints
4. Test complete workflows

🔄 **Estimated Phase 4 Duration**: 4 hours

---

## Emergency Procedures

### If Application Fails to Start
```bash
# 1. Check logs
journalctl -u governance-api -n 100

# 2. Common issues:
# - Port 3001 already in use: sudo lsof -i :3001
# - .env.production not found: verify file exists
# - Database not accessible: test PGPASSWORD=... psql
# - Redis not accessible: test redis-cli -a password ping

# 3. If unresolvable, rollback:
bash /opt/governance/scripts/rollback.sh
```

### If Database Connection Fails
```bash
# Check PostgreSQL
sudo systemctl status postgresql

# Test connection
PGPASSWORD=PASSWORD psql -h localhost -U xio_user -d xio_governance -c "SELECT 1"

# Check logs
sudo tail -30 /var/log/postgresql/postgresql-13-main.log
```

### If Redis Connection Fails
```bash
# Check Redis
sudo systemctl status redis-server

# Test connection
redis-cli -a PASSWORD ping

# Check logs
sudo tail -30 /var/log/redis/redis-server.log
```

---

**Phase 3 Complete**: ✅ Application deployed and running  
**Total Elapsed Time**: ~6 hours (Phase 2 + Phase 3)  
**Next Phase**: 04_POST_DEPLOYMENT_VERIFICATION.md
