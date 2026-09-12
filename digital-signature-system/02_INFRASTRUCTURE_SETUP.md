# Phase 2: Infrastructure Setup (4 Hours)

**Duration**: 4 hours  
**Prerequisites**: Phase 1 complete and signed off  
**Status**: ✅ INFRASTRUCTURE PROVISIONING

---

## Section A: Server Preparation (1 hour)

### System Updates
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git openssh-server openssh-client
```
- [ ] System packages updated
- [ ] SSH server verified running
- [ ] SSH connectivity tested

### User & Permissions
```bash
# Create application user
sudo useradd -m -s /bin/bash app
sudo usermod -aG sudo app

# Create directories
sudo mkdir -p /opt/governance
sudo mkdir -p /backups
sudo mkdir -p /var/log/governance

# Set permissions
sudo chown -R app:app /opt/governance
sudo chown -R app:app /backups
sudo chown -R app:app /var/log/governance

sudo chmod 755 /opt/governance
sudo chmod 755 /backups
sudo chmod 755 /var/log/governance
```
- [ ] Application user 'app' created
- [ ] Directory `/opt/governance` created (10GB free)
- [ ] Directory `/backups` created (50GB free)
- [ ] Permissions set correctly

### Firewall Configuration
```bash
# Ubuntu (UFW)
sudo ufw enable
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS
sudo ufw deny 3001/tcp     # Block direct app port
sudo ufw deny 5432/tcp     # Block direct PostgreSQL
sudo ufw deny 6379/tcp     # Block direct Redis

# Verify
sudo ufw status
```
- [ ] UFW firewall enabled
- [ ] Port 22 (SSH) allowed
- [ ] Port 80 (HTTP) allowed
- [ ] Port 443 (HTTPS) allowed
- [ ] Port 3001 blocked (Nginx proxy)
- [ ] Port 5432 blocked (PostgreSQL)
- [ ] Port 6379 blocked (Redis)

---

## Section B: PostgreSQL Setup (1.5 hours)

### Installation
```bash
# Add PostgreSQL repository
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -

# Install PostgreSQL 13+
sudo apt update
sudo apt install -y postgresql-13 postgresql-contrib-13

# Start service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verify
sudo -u postgres psql --version
```
- [ ] PostgreSQL 13+ installed
- [ ] PostgreSQL service running
- [ ] PostgreSQL enabled on boot

### Database & User Setup
```bash
# Switch to postgres user
sudo -u postgres psql << 'EOF'

-- Create database user
CREATE USER xio_user WITH PASSWORD 'YOUR_SECURE_PASSWORD_HERE';

-- Create database
CREATE DATABASE xio_governance OWNER xio_user;

-- Grant privileges
ALTER DATABASE xio_governance OWNER TO xio_user;

-- Extensions
\c xio_governance
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS uuid-ossp;

-- Verify
\du
\l

EOF
```
- [ ] Database user 'xio_user' created
- [ ] Database 'xio_governance' created
- [ ] User owns database
- [ ] Extensions installed (pgcrypto, uuid-ossp)

### Database Connection Verification
```bash
# Test connection as xio_user
PGPASSWORD=YOUR_PASSWORD psql -h localhost -U xio_user -d xio_governance -c "\dt"

# Expected output: (no relations found - database is empty)
```
- [ ] Connection test successful
- [ ] Can connect as xio_user
- [ ] Database is empty and ready

### PostgreSQL Configuration
```bash
# Edit PostgreSQL configuration
sudo nano /etc/postgresql/13/main/postgresql.conf

# Find and update these settings:
max_connections = 100              # From 100 (adequate)
shared_buffers = 256MB             # From 128MB
effective_cache_size = 1GB         # From 4GB (adjust for your RAM)
work_mem = 16MB                    # From 4MB
maintenance_work_mem = 64MB        # For backups

# Restart PostgreSQL
sudo systemctl restart postgresql
```
- [ ] PostgreSQL configuration updated
- [ ] Connection pool set to 100
- [ ] Memory settings optimized
- [ ] PostgreSQL restarted
- [ ] Verified still running

### PostgreSQL Backup Configuration
```bash
# Create backup directory
sudo mkdir -p /backups/postgresql
sudo chown postgres:postgres /backups/postgresql
sudo chmod 700 /backups/postgresql

# Test backup
sudo -u postgres pg_dump xio_governance | gzip > /backups/postgresql/test-backup.sql.gz

# Verify backup
gunzip -c /backups/postgresql/test-backup.sql.gz | head -20
```
- [ ] Backup directory created
- [ ] Backup permissions set (700)
- [ ] Test backup successful
- [ ] Backup can be verified

---

## Section C: Redis Setup (0.75 hours)

### Installation
```bash
# Install Redis
sudo apt install -y redis-server

# Start service
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Verify
redis-cli ping
# Expected: PONG
```
- [ ] Redis installed
- [ ] Redis service running
- [ ] Redis enabled on boot
- [ ] Redis responds to ping

### Redis Configuration
```bash
# Edit Redis configuration
sudo nano /etc/redis/redis.conf

# Find and update these settings:
port 6379                          # Default (keep)
bind 127.0.0.1                    # Localhost only (secure)
requirepass YOUR_SECURE_PASSWORD  # Set password
maxmemory 512mb                   # Set max memory
maxmemory-policy allkeys-lru      # LRU eviction

# Restart Redis
sudo systemctl restart redis-server

# Verify
redis-cli ping
redis-cli -a YOUR_PASSWORD ping   # With password
# Expected: PONG
```
- [ ] Redis password configured
- [ ] Redis bound to localhost only
- [ ] Max memory set (512MB)
- [ ] Eviction policy set (LRU)
- [ ] Redis restarted
- [ ] Password auth verified

### Redis Test
```bash
redis-cli -a YOUR_PASSWORD << 'EOF'
SET test_key "test_value"
GET test_key
DEL test_key
EOF
```
- [ ] Set/Get operations working
- [ ] Redis persistence verified

---

## Section D: Node.js & npm Setup (0.75 hours)

### Node.js Installation
```bash
# Install Node.js 18 LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node --version
npm --version
```
- [ ] Node.js 18+ installed
- [ ] npm installed
- [ ] Versions verified

---

## Section E: Nginx Reverse Proxy (1 hour)

### Installation
```bash
# Install Nginx
sudo apt install -y nginx

# Start service
sudo systemctl start nginx
sudo systemctl enable nginx

# Verify
sudo systemctl status nginx
# Should show: active (running)
```
- [ ] Nginx installed
- [ ] Nginx service running
- [ ] Nginx enabled on boot

### SSL/TLS Certificate Setup
```bash
# Create certificate directory
sudo mkdir -p /etc/nginx/certs
sudo chmod 700 /etc/nginx/certs

# Copy your certificates (or use Let's Encrypt)
# If using Let's Encrypt:
sudo apt install -y certbot python3-certbot-nginx
sudo certbot certonly --standalone -d your-domain.com

# Copy/symlink certificates
sudo cp /path/to/server.crt /etc/nginx/certs/
sudo cp /path/to/server.key /etc/nginx/certs/
sudo chmod 600 /etc/nginx/certs/server.key

# Verify certificates
openssl x509 -in /etc/nginx/certs/server.crt -text -noout | grep -E "Subject|Issuer|Not Before|Not After"
```
- [ ] Certificate files copied to `/etc/nginx/certs/`
- [ ] Private key permissions set to 600
- [ ] Certificate validity verified (> 30 days)
- [ ] Certificate chain included (if needed)

### Nginx Configuration
```bash
# Backup original config
sudo cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup

# Create reverse proxy configuration
sudo tee /etc/nginx/sites-available/governance << 'EOF'
upstream governance_app {
    server 127.0.0.1:3001;
}

server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/nginx/certs/server.crt;
    ssl_certificate_key /etc/nginx/certs/server.key;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    client_max_body_size 10M;
    gzip on;
    gzip_types text/plain application/json;

    location / {
        proxy_pass http://governance_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /monitoring/metrics {
        proxy_pass http://governance_app;
        access_log off;
    }
}
EOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/governance /etc/nginx/sites-enabled/governance

# Remove default site
sudo rm -f /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t
# Expected: syntax is ok

# Reload Nginx
sudo systemctl reload nginx
```
- [ ] Nginx config created
- [ ] SSL/TLS configured
- [ ] Config syntax verified
- [ ] Nginx reloaded
- [ ] HTTP → HTTPS redirect working

### Nginx Verification
```bash
# Test HTTPS
curl -k https://localhost/

# Test connection routing
curl http://localhost/api/health 2>/dev/null || echo "App not running yet (expected)"
```
- [ ] Nginx listening on port 443
- [ ] HTTP to HTTPS redirect working
- [ ] Reverse proxy configured

---

## Section F: Verification & Final Checks (0.5 hours)

### Service Status Check
```bash
# Check all services
echo "=== PostgreSQL ===" && sudo systemctl status postgresql
echo "=== Redis ===" && sudo systemctl status redis-server
echo "=== Nginx ===" && sudo systemctl status nginx

# All should show: active (running)
```
- [ ] PostgreSQL running
- [ ] Redis running
- [ ] Nginx running

### Network & Connectivity
```bash
# Test database connection
PGPASSWORD=YOUR_PASSWORD psql -h localhost -U xio_user -d xio_governance -c "SELECT version();"

# Test Redis connection
redis-cli -a YOUR_PASSWORD ping

# Test Nginx
curl -k https://localhost/health || echo "OK - App not deployed yet"
```
- [ ] PostgreSQL connected successfully
- [ ] Redis responding to ping
- [ ] Nginx responding on HTTPS

### Disk Space Verification
```bash
df -h /opt/governance
df -h /backups

# Should show: > 10GB free for /opt/governance
#              > 50GB free for /backups
```
- [ ] /opt/governance has > 10GB free
- [ ] /backups has > 50GB free

### System Resource Check
```bash
free -h              # RAM available
nproc                # CPU cores
cat /proc/cpuinfo | grep "model name"  # CPU type
```
- [ ] RAM: > 4GB available
- [ ] CPU: 2-4 cores available
- [ ] All resources adequate

---

## Section G: Post-Setup Documentation

### Environment File Template
Create `.env.production` in `/opt/governance/`:

```bash
cat > /tmp/.env.production.template << 'EOF'
# Application
NODE_ENV=production
PORT=3001
LOG_LEVEL=info

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=xio_governance
DB_USER=xio_user
DB_PASSWORD=YOUR_PASSWORD_HERE

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=YOUR_PASSWORD_HERE

# Security
JWT_SECRET=YOUR_SECURE_SECRET_HERE
RSA_KEY_PATH=/opt/governance/keys

# External APIs
SENESCYT_API_KEY=YOUR_API_KEY
SRI_API_KEY=YOUR_API_KEY
UIF_API_KEY=YOUR_API_KEY
EOF

cat /tmp/.env.production.template
```

- [ ] Environment template reviewed
- [ ] All placeholders identified
- [ ] Ready for Phase 3

---

## Section H: Infrastructure Sign-Off

### Infrastructure Verification Checklist
- [ ] PostgreSQL 13+ installed and running
- [ ] Database 'xio_governance' created
- [ ] User 'xio_user' created with password
- [ ] Redis 6+ installed and running
- [ ] Redis password configured
- [ ] Node.js 18+ installed
- [ ] Nginx installed and running
- [ ] SSL/TLS certificates installed
- [ ] Reverse proxy configured
- [ ] Firewall configured correctly
- [ ] All services set to auto-start on boot
- [ ] Disk space verified (10GB + 50GB)
- [ ] All connectivity tests passed

### Sign-Off

- [ ] Infrastructure Lead: _________________________ Date: _______
- [ ] Database Admin: _________________________ Date: _______
- [ ] Network/Security: _________________________ Date: _______

**Infrastructure Status**: ✅ **READY FOR APPLICATION DEPLOYMENT**

---

## Next Steps

### Immediate
1. All infrastructure running and tested
2. All services auto-start on boot verified
3. Passwords and credentials secured

### Phase 3 (Next)
1. Deploy application code
2. Configure .env.production
3. Run database migrations
4. Start application service

🔄 **Estimated Phase 3 Duration**: 2 hours

---

**Phase 2 Complete**: ✅ Infrastructure provisioned and verified  
**Total Elapsed Time**: ~4 hours  
**Next Phase**: 03_APPLICATION_DEPLOYMENT.md
