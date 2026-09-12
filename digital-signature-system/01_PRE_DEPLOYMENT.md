# Phase 1: Pre-Deployment Checklist (4 Hours)

**Duration**: 4 hours  
**Status**: ✅ DO THIS BEFORE TOUCHING PRODUCTION SERVERS  

---

## Section A: Infrastructure Verification (1 hour)

### Server Requirements
- [ ] Server provisioned (2-4 CPU, 4-8GB RAM minimum)
- [ ] OS: Ubuntu 20.04 LTS or Amazon Linux 2
- [ ] Static IP address assigned
- [ ] DNS records configured (if applicable)
- [ ] SSH access verified (port 22 accessible)
- [ ] Security groups/firewall rules configured:
  - [ ] Port 22 (SSH) - restricted to admin IPs
  - [ ] Port 80 (HTTP) - open for redirects
  - [ ] Port 443 (HTTPS) - open to world
  - [ ] Port 3001 (App) - closed to world (behind Nginx)
  - [ ] Port 5432 (PostgreSQL) - closed to world
  - [ ] Port 6379 (Redis) - closed to world

### Storage & Backup
- [ ] `/opt/governance` directory created (10GB free minimum)
- [ ] `/backups` directory created (50GB free minimum)
- [ ] Backup storage tested and accessible
- [ ] Backup retention policy documented
- [ ] Disaster recovery plan reviewed

### Network & Connectivity
- [ ] Ping external services successful:
  ```bash
  ping -c 1 8.8.8.8          # Internet connectivity
  ping -c 1 api.senescyt.gob.ec  # SENESCYT API
  ping -c 1 api.sri.gob.ec        # SRI API
  ```
- [ ] DNS resolution working:
  ```bash
  nslookup your-domain.com
  ```
- [ ] Firewall allows outbound HTTPS (port 443)

---

## Section B: Credentials & Certificates (1 hour)

### SSL/TLS Certificates
- [ ] SSL certificate obtained (Let's Encrypt or valid CA)
- [ ] Certificate file: `/opt/governance/certs/server.crt`
- [ ] Private key file: `/opt/governance/certs/server.key`
- [ ] Certificate validity: > 30 days
- [ ] Chain certificates included (if required)
- [ ] Permissions correct (600 for private key)

### Environment Secrets
- [ ] Database password generated (strong, 16+ chars)
- [ ] Redis password generated (strong, 16+ chars)
- [ ] JWT secret generated (strong, 32+ chars)
- [ ] API keys for external services collected:
  - [ ] SENESCYT API key
  - [ ] SRI API key
  - [ ] UIF API key
  - [ ] Email service API key
  - [ ] SMS provider API key (if using 2FA)
- [ ] All secrets stored in secure location (not git)
- [ ] Access control verified (only ops team)

### Database Credentials
- [ ] PostgreSQL username planned: `xio_user`
- [ ] PostgreSQL password generated (strong, 16+ chars)
- [ ] PostgreSQL super-user password prepared
- [ ] Database name planned: `xio_governance`
- [ ] Database port confirmed: 5432

---

## Section C: Documentation Review (1 hour)

### Deployment Documentation
- [ ] Read `DEPLOYMENT_PACKAGE_README.md` (this file's companion)
- [ ] Read `02_INFRASTRUCTURE_SETUP.md` (next phase)
- [ ] Read `03_APPLICATION_DEPLOYMENT.md` (deployment phase)
- [ ] Read `04_POST_DEPLOYMENT_VERIFICATION.md` (testing phase)
- [ ] Read `05_MONITORING_OPERATIONS.md` (monitoring phase)
- [ ] Read `06_GO_LIVE_CHECKLIST.md` (launch phase)

### Architecture Documentation
- [ ] Review `PRODUCTION_DEPLOYMENT_GUIDE.md`
- [ ] Review system architecture (database, cache, app)
- [ ] Review network topology (Nginx reverse proxy, firewall rules)
- [ ] Review API endpoints (7 total)
- [ ] Review monitoring approach (Prometheus/Grafana)

### Operational Procedures
- [ ] Review `OPERATIONS_DAILY.md`
- [ ] Review `OPERATIONS_WEEKLY.md`
- [ ] Review `OPERATIONS_EMERGENCY.md`
- [ ] Understand alert procedures
- [ ] Understand escalation procedures
- [ ] Understand rollback procedures

---

## Section D: Team & Communication (1 hour)

### Team Assignment
- [ ] Operations lead assigned
- [ ] Database admin assigned
- [ ] Security engineer assigned
- [ ] On-call primary assigned
- [ ] On-call secondary assigned
- [ ] All contacts documented

### Communication Plan
- [ ] Stakeholders notified of deployment date/time
- [ ] Maintenance window scheduled (24 hours recommended)
- [ ] Expected downtime communicated (if any)
- [ ] Rollback scenarios explained
- [ ] Emergency contacts distributed
- [ ] Communication channel established (Slack, email)

### Team Training
- [ ] All team members reviewed documentation
- [ ] All team members know their role
- [ ] Deployment procedures rehearsed (dry run)
- [ ] Rollback procedures rehearsed (dry run)
- [ ] On-call team briefed on system
- [ ] Support team trained on basic operations

---

## Section E: Final Verification (1 hour)

### Pre-Deployment Build Check
```bash
# On deployment/CI machine
cd /path/to/governance-system
npm run build

# Verify build succeeded
ls -lh dist/server.js
# Should be > 200KB
```
- [ ] TypeScript compilation successful (zero errors)
- [ ] Output file exists: `dist/server.js`
- [ ] Output file size reasonable (> 200KB)

### Deployment Package Preparation
```bash
# Create deployment package
tar -czf governance-system-prod.tar.gz \
  dist/ \
  package.json \
  package-lock.json \
  keys/ \
  .env.production

# Verify package
ls -lh governance-system-prod.tar.gz
# Should be < 50MB
```
- [ ] Deployment package created
- [ ] Package size reasonable (< 50MB)
- [ ] Package integrity verified
- [ ] Package uploaded to secure location
- [ ] Backup copy created

### Git Status Check
```bash
git status
# Should show: nothing to commit, working tree clean

git log --oneline -3
# Should show all recent commits
```
- [ ] Git working tree clean
- [ ] All code committed
- [ ] All commits pushed to main
- [ ] Branch is up-to-date with remote

### Dependency Verification
```bash
npm list
# Verify all 15 critical dependencies:
```
- [ ] express (API framework)
- [ ] pg (PostgreSQL driver)
- [ ] redis (Cache client)
- [ ] prom-client (Prometheus metrics)
- [ ] winston (Logging)
- [ ] crypto (Node.js built-in)
- [ ] jsonwebtoken (JWT)
- [ ] dotenv (Environment variables)
- [ ] All other dependencies listed

---

## Section F: Go/No-Go Decision

### Deployment Decision Matrix

```
✅ GREEN (Ready to Deploy)
   All sections A-E PASSED
   No blockers or open issues
   Infrastructure ready
   Team trained and prepared
   Go-Live decision: PROCEED

🟡 YELLOW (Proceed with Caution)
   Minor issues found and documented
   Workarounds identified
   Risk assessed and accepted
   Go-Live decision: CONDITIONAL (with mitigation plan)

🔴 RED (DO NOT DEPLOY)
   Critical issues found
   Security concerns identified
   Infrastructure not ready
   Team not prepared
   Go-Live decision: POSTPONE (fix issues first)
```

### Final Sign-Off

- [ ] Operations Lead: _________________________ Date: _______
- [ ] Database Admin: _________________________ Date: _______
- [ ] Security Engineer: _________________________ Date: _______
- [ ] Platform Manager: _________________________ Date: _______

### Deployment Status

**Pre-Deployment Checklist Status**: 
```
☐ NOT STARTED
☑ IN PROGRESS
☐ COMPLETE - READY TO DEPLOY
☐ BLOCKED - ISSUES FOUND
```

---

## Next Steps

### If GREEN (Ready)
1. Proceed to `02_INFRASTRUCTURE_SETUP.md`
2. Start Phase 2 immediately
3. Expected completion: +4 hours

### If YELLOW (Proceed with Caution)
1. Document all issues and mitigations
2. Assign owner for each mitigation
3. Verify mitigations work before proceeding
4. Get explicit approval from all stakeholders
5. Then proceed to Phase 2

### If RED (Do Not Deploy)
1. Document all blocking issues
2. Assign owner for each issue
3. Fix all issues completely
4. Restart this checklist from beginning
5. Do not proceed until all issues resolved

---

## Emergency Contact

During Phase 1, if issues arise:

- **Infrastructure Questions**: Infrastructure Lead
- **Security Questions**: Security Team
- **Database Questions**: Database Admin
- **Escalation**: Platform Manager

---

**Phase 1 Status**: ✅ CRITICAL PHASE

Everything in Phase 1 must be completed and signed off before proceeding to Phase 2. No exceptions. This is your last chance to catch issues before going to production.

🔄 **Estimated Time to Complete**: 4 hours  
⏭️ **Next Phase**: 02_INFRASTRUCTURE_SETUP.md (Infrastructure Setup - 4 hours)
