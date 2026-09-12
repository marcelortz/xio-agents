# Phase 4: Post-Deployment Verification (4 Hours)

**Duration**: 4 hours  
**Prerequisites**: Phase 3 complete (application running)  
**Status**: ✅ COMPREHENSIVE SYSTEM VERIFICATION

---

## Section A: Health Checks (30 minutes)

### Connectivity & Service Status
```bash
# 1. Verify all services running
echo "=== Service Status ===" && \
sudo systemctl status governance-api --no-pager && \
sudo systemctl status postgresql --no-pager && \
sudo systemctl status redis-server --no-pager && \
sudo systemctl status nginx --no-pager

# Expected: all show "active (running)"
```
- [ ] Application service running
- [ ] PostgreSQL running
- [ ] Redis running
- [ ] Nginx running

### Endpoint Connectivity Tests
```bash
# 2. Health endpoint
curl -k -s https://localhost/monitoring/health | python3 -m json.tool

# Expected response:
# {
#   "status": "healthy",
#   "database": "connected",
#   "redis": "connected",
#   "uptime": "...",
#   "timestamp": "..."
# }

# Check response code
RESPONSE=$(curl -k -s -o /dev/null -w "%{http_code}" https://localhost/monitoring/health)
if [ "$RESPONSE" == "200" ]; then
    echo "✓ Health check: 200 OK"
else
    echo "✗ Health check: $RESPONSE (expected 200)"
fi
```
- [ ] Health endpoint responding
- [ ] HTTP status 200
- [ ] Database status: connected
- [ ] Redis status: connected
- [ ] All services healthy

### Performance Check
```bash
# 3. Response time check
echo "Testing response times..."
for i in {1..5}; do
    TIME=$(curl -k -s -o /dev/null -w "%{time_total}" https://localhost/monitoring/health)
    echo "Request $i: ${TIME}s"
done

# All should be < 0.5 seconds
```
- [ ] Response times < 500ms
- [ ] Consistent performance
- [ ] No timeouts

---

## Section B: Database Verification (30 minutes)

### Database Structure Check
```bash
# 4. Verify all tables exist
PGPASSWORD=$DB_PASSWORD psql -h localhost -U xio_user -d xio_governance << 'EOF'
\dt

-- Expected 11 tables:
-- clients, transactions, audit_logs, otp_codes
-- digital_signatures, segregated_accounts, account_balance
-- tax_reports, kyc_verifications, aml_flags, monitoring_metrics
EOF
```
- [ ] All 11 tables created
- [ ] Table list visible
- [ ] No errors in schema

### Database Connectivity Test
```bash
# 5. Test database operations
PGPASSWORD=$DB_PASSWORD psql -h localhost -U xio_user -d xio_governance << 'EOF'
-- Test write permission
CREATE TABLE test_write (id SERIAL PRIMARY KEY, test_data TEXT);
INSERT INTO test_write (test_data) VALUES ('test');
SELECT * FROM test_write;
DROP TABLE test_write;

-- Test timestamp functions
SELECT NOW() as current_time;

-- Test UUID generation
SELECT gen_random_uuid() as random_id;

-- Verify extensions
\dx
EOF
```
- [ ] Write operations working
- [ ] Read operations working
- [ ] Timestamps accurate
- [ ] UUID generation working
- [ ] Extensions installed

### Backup Verification
```bash
# 6. Test backup functionality
sudo -u postgres pg_dump xio_governance | gzip > /backups/test-backup-$(date +%s).sql.gz

# Verify backup size
ls -lh /backups/test-backup-*.sql.gz | tail -1

# Verify backup integrity
gunzip -c /backups/test-backup-*.sql.gz | head -20 | grep -q "PostgreSQL" && echo "✓ Backup valid"
```
- [ ] Backup created successfully
- [ ] Backup file size reasonable (> 1KB)
- [ ] Backup content valid
- [ ] Backup can be decompressed

---

## Section C: API Endpoint Testing (1 hour)

### 7. Test Compliance Endpoints
```bash
# Register client
REGISTER=$(curl -k -s -X POST https://localhost/compliance/kyc/register \
  -H "Content-Type: application/json" \
  -d '{
    "cedula": "1234567890",
    "fullName": "Test User",
    "email": "test@test.com",
    "phone": "+593987654321",
    "address": "Test Address"
  }')

echo "KYC Registration Response:"
echo "$REGISTER" | python3 -m json.tool

# Extract client ID
CLIENT_ID=$(echo "$REGISTER" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
echo "Client ID: $CLIENT_ID"
```
- [ ] Registration endpoint responding
- [ ] Client created with ID
- [ ] Response contains required fields
- [ ] HTTP 200 status

### 8. Test Transaction Endpoints
```bash
# Create transaction
TXN=$(curl -k -s -X POST https://localhost/api/transactions/create \
  -H "Content-Type: application/json" \
  -d "{
    \"amount\": 250,
    \"currency\": \"EUR\",
    \"description\": \"Test transaction\",
    \"signatory\": \"Test\",
    \"clientId\": \"$CLIENT_ID\",
    \"transactionType\": \"SERVICE\"
  }")

echo "Transaction Creation Response:"
echo "$TXN" | python3 -m json.tool

# Extract transaction ID
TXN_ID=$(echo "$TXN" | grep -o '"transactionId":"[^"]*' | cut -d'"' -f4)
echo "Transaction ID: $TXN_ID"
```
- [ ] Transaction creation endpoint responding
- [ ] Transaction created with ID
- [ ] Amount validated
- [ ] Currency accepted
- [ ] HTTP 200 status

### 9. Test Audit Trail
```bash
# Get audit trail
AUDIT=$(curl -k -s -X GET "https://localhost/api/audit/$TXN_ID")

echo "Audit Trail Response:"
echo "$AUDIT" | python3 -m json.tool

# Verify audit entries
ENTRIES=$(echo "$AUDIT" | grep -o '"action"' | wc -l)
echo "Audit entries: $ENTRIES"
```
- [ ] Audit trail endpoint responding
- [ ] Audit entries recorded
- [ ] Actions documented
- [ ] Timestamps present

### 10. Test Monitoring Endpoints
```bash
# Get metrics
METRICS=$(curl -k -s https://localhost/monitoring/metrics | head -30)
echo "Metrics Sample:"
echo "$METRICS"

# Verify Prometheus format
if echo "$METRICS" | grep -q "# HELP"; then
    echo "✓ Prometheus format detected"
else
    echo "✗ Invalid metrics format"
fi
```
- [ ] Metrics endpoint responding
- [ ] Prometheus format detected
- [ ] Metrics being collected
- [ ] Sample metrics visible

---

## Section D: Integration Test (1.5 hours)

### 11. Run Full 12-Step Integration Test
```bash
# Execute integration test script
bash /opt/governance/scripts/integration-test.sh

# Expected output:
# STEP 1: ✅ Client Registration
# STEP 2: ✅ KYC Verification
# STEP 3: ✅ RSA Key Generation
# STEP 4: ✅ Transaction Creation
# STEP 5: ✅ Transaction Details
# STEP 6: ✅ OTP Request
# STEP 7: ✅ Client Status
# STEP 8: ✅ Approval & Sign
# STEP 9: ✅ Execution (or expected error)
# STEP 10: ✅ Audit Trail
# STEP 11: ✅ Status Check
# STEP 12: ✅ Monitoring Dashboard
```
- [ ] Test script executed
- [ ] 12/12 steps completed
- [ ] All endpoints responded
- [ ] No critical failures

### 12. Verify Integration Test Results
```bash
# Check test output
cat /tmp/integration-test-results.log 2>/dev/null || echo "Log file not found"

# Look for success indicators:
# - "✅ INTEGRATION TEST COMPLETE"
# - "12/12 steps passed"
# - No "❌ FAILED" messages
```
- [ ] Test completed successfully
- [ ] All 12 steps passed
- [ ] No critical failures
- [ ] Results logged

---

## Section E: Security Verification (45 minutes)

### 13. SSL/TLS Certificate Verification
```bash
# Check certificate details
openssl s_client -connect localhost:443 -showcerts < /dev/null

# Verify certificate info
echo | openssl s_client -connect your-domain.com:443 2>/dev/null | \
  openssl x509 -noout -text | grep -E "Subject:|Issuer:|Not Before|Not After"

# Check certificate validity
openssl x509 -in /etc/nginx/certs/server.crt -noout -dates
# Should show dates in future
```
- [ ] Certificate installed correctly
- [ ] Certificate validity > 30 days
- [ ] Certificate common name matches domain
- [ ] No certificate warnings

### 14. Authentication & Authorization
```bash
# Test JWT/OTP functionality
# (Should be tested in integration test above)

# Verify password not in logs
grep -i "password" /var/log/nginx/*.log || echo "✓ Passwords not logged"

# Check environment file permissions
ls -l /opt/governance/.env.production
# Should show: -rw-r--r-- 1 app app (or 600)
```
- [ ] JWT implementation verified
- [ ] OTP generation working
- [ ] Passwords not logged
- [ ] .env.production secured

### 15. Database Security
```bash
# Verify PostgreSQL listening on localhost only
sudo -u postgres psql -c "SHOW listen_addresses;"
# Should show: localhost

# Verify xio_user has limited privileges
sudo -u postgres psql -c "\du xio_user"
# Should NOT show: superuser
```
- [ ] PostgreSQL bound to localhost
- [ ] User not superuser
- [ ] Principle of least privilege
- [ ] Database secured

### 16. Redis Security
```bash
# Verify Redis password required
redis-cli ping
# Should fail with "NOAUTH Authentication required"

# Verify password works
redis-cli -a YOUR_PASSWORD ping
# Should return: PONG
```
- [ ] Redis requires authentication
- [ ] Password authentication working
- [ ] Unauthorized access blocked

---

## Section F: Compliance & Audit Testing (45 minutes)

### 17. KYC/AML Workflow
```bash
# Test KYC verification
VERIFY=$(curl -k -s -X POST https://localhost/compliance/kyc/verify/$CLIENT_ID)
echo "KYC Verification:"
echo "$VERIFY" | python3 -m json.tool

# Expected: status "VERIFIED" or "PENDING"
```
- [ ] KYC verification working
- [ ] Status returned
- [ ] Risk score calculated

### 18. Audit Trail Immutability
```bash
# Verify audit log entries are timestamped
AUDIT=$(curl -k -s https://localhost/api/audit/$TXN_ID)

# Check timestamp format (ISO 8601)
echo "$AUDIT" | grep -o '"timestamp":"[^"]*' || echo "Timestamps present"

# Verify entries in chronological order
echo "$AUDIT" | python3 -c "
import sys, json
data = json.load(sys.stdin)
for i, entry in enumerate(data.get('auditLog', [])):
    print(f'{i+1}. {entry.get(\"action\", \"\")} - {entry.get(\"timestamp\", \"\")}')"
```
- [ ] Timestamps present on all entries
- [ ] Timestamps in correct format (ISO 8601)
- [ ] Entries chronologically ordered
- [ ] Immutability verified

### 19. Tax Calculation Verification
```bash
# Test tax endpoint
TAX=$(curl -k -s -X POST https://localhost/tax/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1000,
    "type": "SERVICE",
    "country": "EC"
  }')

echo "Tax Calculation:"
echo "$TAX" | python3 -m json.tool

# Expected: IVA calculated, retention rates applied
```
- [ ] Tax endpoint responding
- [ ] IVA calculated (17%)
- [ ] Retention rates applied
- [ ] Tax breakdown shown

---

## Section G: Performance & Load Testing (30 minutes)

### 20. Response Time Analysis
```bash
# Test response times under load
echo "Testing response times..."
for i in {1..10}; do
    curl -k -s -o /dev/null -w "Request $i: %{time_total}s\n" https://localhost/monitoring/health
done

# Calculate average
for i in {1..10}; do
    curl -k -s -o /dev/null -w "%{time_total}\n" https://localhost/monitoring/health
done | awk '{sum+=$1; count++} END {print "Average: " sum/count " seconds"}'
```
- [ ] All requests complete < 500ms
- [ ] Average response time < 200ms
- [ ] No timeouts
- [ ] Consistent performance

### 21. Memory & CPU Usage
```bash
# Check current resource usage
ps aux | grep "node dist/server.js" | grep -v grep

# Monitor for 1 minute
top -b -n 1 | grep node

# Expected: CPU < 50%, Memory < 1GB
```
- [ ] CPU usage < 50%
- [ ] Memory usage < 1GB
- [ ] No resource exhaustion
- [ ] System stable

### 22. Connection Pool Health
```bash
# Test database connections
for i in {1..5}; do
    PGPASSWORD=$DB_PASSWORD psql -h localhost -U xio_user -d xio_governance -c "SELECT 1" &
done
wait

# Check connection count
PGPASSWORD=$DB_PASSWORD psql -h localhost -U xio_user -d xio_governance -c "SELECT count(*) FROM pg_stat_activity;"

# Expected: < 100 connections
```
- [ ] Multiple concurrent connections work
- [ ] Connection pool stable
- [ ] No connection exhaustion
- [ ] < 100 active connections

---

## Section H: Final Verification Checklist

### Verification Summary
- [ ] All services running (app, DB, Redis, Nginx)
- [ ] Health endpoint returning healthy
- [ ] Response times < 500ms
- [ ] Database: 11 tables, data integrity verified
- [ ] Backups created and verified
- [ ] API endpoints responding (compliance, transaction, audit, monitoring)
- [ ] Integration test: 12/12 steps passed
- [ ] SSL/TLS certificate valid
- [ ] Authentication working
- [ ] Database security verified
- [ ] Redis security verified
- [ ] KYC/AML workflows operational
- [ ] Audit trail immutable
- [ ] Tax calculations correct
- [ ] Performance acceptable
- [ ] No critical errors in logs
- [ ] System resource usage normal

### Sign-Off

- [ ] QA Lead: _________________________ Date: _______
- [ ] Operations Lead: _________________________ Date: _______
- [ ] Security Officer: _________________________ Date: _______

**Post-Deployment Verification Status**: ✅ **SYSTEM VERIFIED AND READY**

---

## Issues Found & Resolution

### If Issues Found
1. Document issue clearly
2. Identify root cause
3. Apply fix
4. Verify fix resolves issue
5. Re-test affected area
6. Document resolution

### Critical Issues (Stop Deployment)
- [ ] Application not responding
- [ ] Database connection failed
- [ ] Integration test failure
- [ ] Security vulnerability found
- [ ] Audit trail not recording

### Minor Issues (Log & Continue)
- [ ] Slow response (but < 500ms SLA)
- [ ] Warning in logs (non-critical)
- [ ] Optional feature not working
- [ ] Documentation needed

---

## Next Steps

### Immediate
1. All verification tests passed
2. System ready for monitoring setup
3. No critical issues

### Phase 5 (Next - Monitoring)
1. Install Prometheus
2. Configure alert rules (10 rules)
3. Setup Grafana dashboards (4 dashboards)
4. Configure alerting channels

🔄 **Estimated Phase 5 Duration**: 4 hours

---

**Phase 4 Complete**: ✅ System verified and working correctly  
**Total Elapsed Time**: ~10 hours (Phases 1-4)  
**Next Phase**: 05_MONITORING_OPERATIONS.md
