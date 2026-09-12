# 🚀 Staging Deployment Guide

**Date**: 2026-09-12  
**Status**: ✅ DEPLOYED & OPERATIONAL  
**Environment**: Staging  
**Port**: 3002  

---

## 📋 Deployment Summary

The complete corporate governance system with all 3 integrated layers has been successfully deployed to a staging environment.

```
┌─────────────────────────────────────────┐
│  STAGING ENVIRONMENT (Port 3002)         │
├─────────────────────────────────────────┤
│  ✅ KYC/AML Compliance                  │
│  ✅ Account Segregation                 │
│  ✅ RSA-2048 Digital Signatures          │
│  ✅ Immutable Audit Trail                │
│  ✅ All 25 REST Endpoints                │
└─────────────────────────────────────────┘
```

---

## 🎯 Quick Start

### 1. Deploy to Staging
```bash
cd digital-signature-system
bash scripts/deploy-staging.sh
```

The script will:
- ✅ Verify prerequisites (Node.js, npm)
- ✅ Clean staging environment
- ✅ Install dependencies
- ✅ Compile TypeScript
- ✅ Kill existing processes
- ✅ Start staging server on port 3002
- ✅ Run health checks
- ✅ Execute smoke tests

### 2. Verify Deployment
```bash
# Health check
curl http://localhost:3002/

# Segregation compliance report
curl http://localhost:3002/segregation/compliance/report

# Available endpoints
curl http://localhost:3002/api-docs
```

### 3. Run Full Integration Test
```bash
# Modify base URL in script to use port 3002
# Then run:
bash scripts/test-complete-integration.sh
```

---

## 📊 Deployment Status

### Current Environment

| Component | Status | Details |
|-----------|--------|---------|
| Server | ✅ Running | Port 3002 |
| Database | ✅ Active | staging.db |
| KYC/AML | ✅ Operational | 6 endpoints |
| Segregation | ✅ Operational | 10 endpoints |
| Signatures | ✅ Operational | 9 endpoints |
| Audit Trail | ✅ Operational | Immutable |

### Smoke Test Results

| Test | Result | Details |
|------|--------|---------|
| KYC Registration | ✅ PASSED | Client registered, KYC PENDING |
| Account Segregation | ✅ PASSED | Account created, balance 0 |
| RSA Key Generation | ✅ PASSED | 2048-bit keys generated |
| Compliance Report | ✅ PASSED | Report generated (empty state) |

---

## 🔌 API Endpoints (All Available)

### LAYER 1: KYC/AML (6 endpoints)
```
POST   http://localhost:3002/compliance/kyc/register
POST   http://localhost:3002/compliance/kyc/verify/:clientId
GET    http://localhost:3002/compliance/client/:clientId
POST   http://localhost:3002/compliance/validate-transaction
GET    http://localhost:3002/compliance/flags/active
POST   http://localhost:3002/compliance/report-uif/:flagId
```

### LAYER 2: Account Segregation (10 endpoints)
```
POST   http://localhost:3002/segregation/accounts/create
POST   http://localhost:3002/segregation/transactions/record
POST   http://localhost:3002/segregation/ledger/verify/:accountId/:entryId
POST   http://localhost:3002/segregation/accounts/:id/reconcile
POST   http://localhost:3002/segregation/transfers/create
POST   http://localhost:3002/segregation/guarantee/allocate
GET    http://localhost:3002/segregation/compliance/report
GET    http://localhost:3002/segregation/accounts/:id
GET    http://localhost:3002/segregation/accounts/type/:type
GET    http://localhost:3002/segregation/integrity/verify
```

### LAYER 3: Signatures & Transactions (9 endpoints)
```
POST   http://localhost:3002/api/keys/generate
POST   http://localhost:3002/api/transactions/create
GET    http://localhost:3002/api/transactions/pending
GET    http://localhost:3002/api/transactions/high-value
POST   http://localhost:3002/api/transactions/:id/approve
POST   http://localhost:3002/api/transactions/:id/execute
POST   http://localhost:3002/api/transactions/:id/verify
POST   http://localhost:3002/api/transactions/:id/reject
GET    http://localhost:3002/api/audit/:id
```

---

## 📁 Configuration Files

### .env.staging
Located in project root. Key settings:

```
PORT=3002
NODE_ENV=staging
LOG_LEVEL=debug

# Features
ENABLE_KYC_VERIFICATION=true
ENABLE_AML_CHECKS=true
ENABLE_ACCOUNT_SEGREGATION=true
ENABLE_DIGITAL_SIGNATURES=true
ENABLE_AUDIT_LOGGING=true

# Compliance
KYC_VERIFICATION_STRICT=true
AML_SPIKE_THRESHOLD=3.0
GUARANTEE_FUND_PERCENTAGE=0.05
AUTO_BLOCK_RISK_SCORE_THRESHOLD=85

# Demo mode (real SENESCYT/UIF integration disabled)
DEMO_MODE=true
UIF_REPORTING_ENABLED=false
SENESCYT_API_ENABLED=false
```

---

## 📝 Logging

### Log Files
- **Server Logs**: `staging-server.log`
- **Access Logs**: `logs/staging.log`
- **Database**: `staging.db` (SQLite)

### View Logs
```bash
# Real-time server logs
tail -f staging-server.log

# All log files
ls -la logs/

# Database info
ls -la staging.db
```

---

## 🧪 Test Scenarios

### Scenario 1: Complete KYC → AML → Segregation → Signature Flow

```bash
# 1. Register client
curl -X POST http://localhost:3002/compliance/kyc/register \
  -H "Content-Type: application/json" \
  -d '{
    "cedula": "1234567890",
    "fullName": "Test Client",
    "email": "test@example.com",
    "phone": "+593999999999",
    "address": "Staging Lab"
  }'

# 2. Create segregated accounts
curl -X POST http://localhost:3002/segregation/accounts/create \
  -H "Content-Type: application/json" \
  -d '{
    "accountNumber": "ES0001",
    "bankName": "Staging Bank A",
    "accountType": "CLIENT"
  }'

# 3. Deposit funds
curl -X POST http://localhost:3002/segregation/transactions/record \
  -H "Content-Type: application/json" \
  -d '{
    "accountId": "ACC-xxx",
    "transactionType": "DEPOSIT",
    "amount": 100000,
    "description": "Test deposit"
  }'

# 4. Generate RSA keys
curl -X POST http://localhost:3002/api/keys/generate \
  -H "Content-Type: application/json" \
  -d '{"keyId": "staging-keys"}'

# 5. Create transaction
curl -X POST http://localhost:3002/api/transactions/create \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 50000,
    "currency": "EUR",
    "description": "Staging test transaction"
  }'
```

---

## 🔍 Monitoring

### Health Checks

```bash
# Server health
curl http://localhost:3002/

# Segregation compliance
curl http://localhost:3002/segregation/compliance/report

# Active AML flags
curl http://localhost:3002/compliance/flags/active

# Segregation integrity
curl http://localhost:3002/segregation/integrity/verify
```

### Process Management

```bash
# Check if server is running
ps aux | grep "node\|npm" | grep -v grep

# Get server PID
ps aux | grep "npm start" | grep -v grep | awk '{print $2}'

# Kill server gracefully
kill <PID>

# Force kill
kill -9 <PID>
```

---

## 🚀 Deployment Checklist

### Pre-Deployment ✅
- [x] Code compiled without errors
- [x] All 25 endpoints available
- [x] Database schema created
- [x] Configuration files ready
- [x] Dependencies installed

### Deployment ✅
- [x] Server started on port 3002
- [x] Health checks passed
- [x] Smoke tests passed
- [x] Environment isolated from production

### Post-Deployment ✅
- [x] KYC/AML operational
- [x] Account segregation operational
- [x] Digital signatures operational
- [x] Audit trail operational
- [x] All endpoints responding

### Testing Ready ✅
- [x] Can run integration tests
- [x] Can run smoke tests
- [x] Can run full workflows
- [x] Can test all 3 layers together

---

## 🔐 Security Notes

### Staging Isolation
- Separate database (`staging.db`)
- Separate port (3002)
- Separate configuration (`.env.staging`)
- Demo mode enabled (no external API calls)

### Data Privacy
- All data in staging DB
- RSA keys in `keys/staging/`
- Logs in `logs/staging.log`
- No production data used

### Production Readiness
- ⏳ SENESCYT integration (pending)
- ⏳ UIF API connection (pending)
- ⏳ PostgreSQL migration (pending)
- ⏳ 2FA for Síndico (pending)

---

## 📊 Next Steps

### Immediate (Testing)
1. Run `test-complete-integration.sh` against staging
2. Verify all 3 layers work together
3. Check database integrity
4. Monitor logs for errors

### Short-term (Validation)
1. Load testing
2. Security testing
3. Compliance verification
4. Performance profiling

### Medium-term (Production)
1. PostgreSQL migration
2. SENESCYT integration
3. UIF API connection
4. 2FA implementation
5. SSL/TLS certificates
6. Rate limiting
7. DDoS protection

---

## 🆘 Troubleshooting

### Port Already in Use
```bash
# Find process on port 3002
lsof -i :3002

# Kill process
kill -9 <PID>
```

### Database Corruption
```bash
# Remove staging DB
rm staging.db

# Redeploy
bash scripts/deploy-staging.sh
```

### Dependencies Issues
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Server Won't Start
```bash
# Check logs
cat staging-server.log

# Verify Node.js
node --version
npm --version

# Check ports
netstat -tuln | grep 3002
```

---

## 📞 Support

For issues or questions:
1. Check logs: `staging-server.log`
2. Review this guide
3. Run smoke tests
4. Check git status

---

**Staging Deployment: ✅ COMPLETE & OPERATIONAL**

System ready for integration testing with all 3 layers functional.
