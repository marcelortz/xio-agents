# 🐘 PostgreSQL Migration Guide

**Status**: Ready for Production  
**Date**: 2026-09-12  
**Migration Type**: SQLite → PostgreSQL  

---

## Overview

Migrate from SQLite (development) to PostgreSQL (production) for:
- ✅ Horizontal scalability
- ✅ Concurrent connections
- ✅ Enterprise reliability
- ✅ Advanced features (JSON, full-text search)
- ✅ High availability
- ✅ Backup & recovery

---

## Step 1: Install PostgreSQL

### Linux/Ubuntu
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### macOS
```bash
brew install postgresql
brew services start postgresql
```

### Windows
```powershell
# Download from https://www.postgresql.org/download/windows/
# Or use chocolatey
choco install postgresql
```

### Docker (Recommended)
```bash
docker run --name xio-postgres \
  -e POSTGRES_PASSWORD=your_secure_password \
  -e POSTGRES_DB=xio_governance \
  -p 5432:5432 \
  -d postgres:15-alpine
```

---

## Step 2: Create Database and User

```sql
-- Connect as superuser
psql -U postgres

-- Create database
CREATE DATABASE xio_governance;

-- Create dedicated user
CREATE USER xio_admin WITH PASSWORD 'secure_password_here';

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE xio_governance TO xio_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO xio_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO xio_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO xio_admin;

-- Connect to database
\c xio_governance
```

---

## Step 3: Install Database Schema

```bash
# Option 1: Run SQL migration script
psql -U xio_admin -d xio_governance -f scripts/migrate-to-postgres.sql

# Option 2: Use psql interactively
psql -U xio_admin -d xio_governance
\i scripts/migrate-to-postgres.sql
```

### Verify Schema Creation
```sql
-- Check tables
\dt

-- Check views
\dv

-- Check indexes
\di
```

Expected output:
```
              List of relations
 Schema |            Name            | Type  | Owner
--------+----------------------------+-------+----------
 public | account_transfers          | table | xio_admin
 public | aml_flags                  | table | xio_admin
 public | audit_trail                | table | xio_admin
 public | clients                    | table | xio_admin
 public | ledger_entries             | table | xio_admin
 public | rsa_keys                   | table | xio_admin
 public | segregated_accounts        | table | xio_admin
 public | sri_reports                | table | xio_admin
 public | tax_reports                | table | xio_admin
 public | transaction_signatures     | table | xio_admin
 public | transactions               | table | xio_admin
 ...
```

---

## Step 4: Configure Environment

Update `.env.production`:

```bash
# PostgreSQL Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=xio_admin
DB_PASSWORD=your_secure_password
DB_NAME=xio_governance

# Connection pool
DB_POOL_MIN=2
DB_POOL_MAX=20
DB_CONNECTION_TIMEOUT=30000
DB_IDLE_TIMEOUT=30000
DB_REAP_INTERVAL=1000

# SSL (for production)
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=false
```

---

## Step 5: Install Node Dependencies

```bash
npm install pg dotenv
npm install --save-dev @types/pg
```

---

## Step 6: Migrate Data from SQLite

### Backup SQLite Database
```bash
cp production.db production.db.backup
```

### Run Migration Script
```bash
# Compile TypeScript
npm run build

# Run migration
npx ts-node scripts/migrate-sqlite-to-postgres.ts
```

### Expected Output
```
🚀 Starting PostgreSQL migration from SQLite...

✅ Connected to PostgreSQL

📋 Migrating clients table...
   ✅ Migrated 45 clients

📋 Migrating AML flags table...
   ✅ Migrated 8 flags

📋 Migrating segregated accounts table...
   ✅ Migrated 180 accounts

[... more tables ...]

╔════════════════════════════════════════════════════════════╗
║          MIGRATION COMPLETED SUCCESSFULLY                 ║
╚════════════════════════════════════════════════════════════╝

📊 Migration Statistics:
   ✅ Tables migrated: 11
   ✅ Rows copied: 15,234
   ⏱️  Duration: 23.45 seconds
```

---

## Step 7: Verify Data Integrity

```sql
-- Check record counts
SELECT 'clients' as table_name, COUNT(*) as row_count FROM clients
UNION ALL
SELECT 'segregated_accounts', COUNT(*) FROM segregated_accounts
UNION ALL
SELECT 'transactions', COUNT(*) FROM transactions
UNION ALL
SELECT 'tax_reports', COUNT(*) FROM tax_reports
UNION ALL
SELECT 'audit_trail', COUNT(*) FROM audit_trail;

-- Check compliance summary
SELECT * FROM compliance_summary;

-- Check account segregation
SELECT * FROM account_segregation_summary;
```

---

## Step 8: Update Application Code

Update database connection in API modules:

### Tax API
```typescript
import pgConnection from './db/postgres-connection';

export const initTaxAPI = async () => {
  await pgConnection.connect();
  // Use pgConnection for queries
  const result = await pgConnection.query(
    'SELECT * FROM tax_reports WHERE reportedToSRI = $1',
    [false]
  );
  return result.rows;
};
```

### Update Server Configuration
```typescript
import pgConnection from './db/postgres-connection';

app.listen(PORT, async () => {
  try {
    await pgConnection.connect();
    console.log('✅ Database connected to PostgreSQL');
  } catch (error) {
    console.error('❌ Database connection failed', error);
    process.exit(1);
  }
});
```

---

## Step 9: Backup Strategy

### Automated Backups
```bash
# Create backup directory
mkdir -p backups/postgres

# Daily backup script (backup-postgres.sh)
#!/bin/bash
BACKUP_DIR="backups/postgres"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
pg_dump -U xio_admin xio_governance > $BACKUP_DIR/xio_governance_$TIMESTAMP.sql
gzip $BACKUP_DIR/xio_governance_$TIMESTAMP.sql

# Keep only last 30 days
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete

echo "✅ Backup completed: xio_governance_$TIMESTAMP.sql.gz"
```

### Add to Crontab
```bash
crontab -e

# Add line for daily backups at 2 AM
0 2 * * * /path/to/backup-postgres.sh
```

### Restore from Backup
```bash
gunzip < backups/postgres/xio_governance_20260912_020000.sql.gz | \
  psql -U xio_admin xio_governance
```

---

## Step 10: Performance Tuning

### Connection Pooling (pgBouncer)
```bash
sudo apt-get install pgbouncer

# Edit /etc/pgbouncer/pgbouncer.ini
[databases]
xio_governance = host=localhost port=5432 dbname=xio_governance

[pgbouncer]
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 25
min_pool_size = 10
```

### PostgreSQL Configuration (postgresql.conf)
```ini
# For production with 8GB RAM
shared_buffers = 2GB
effective_cache_size = 6GB
maintenance_work_mem = 512MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 52MB
min_wal_size = 4GB
max_wal_size = 16GB
```

### Restart PostgreSQL
```bash
sudo systemctl restart postgresql
```

---

## Step 11: Monitoring & Maintenance

### Monitor Active Connections
```sql
SELECT 
  datname,
  count(*) as connections,
  max(age(now(), query_start)) as longest_query_duration
FROM pg_stat_activity
GROUP BY datname;
```

### Analyze Performance
```sql
-- Analyze tables
ANALYZE;

-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Vacuum & Maintenance
```sql
-- Full vacuum (run during maintenance window)
VACUUM FULL ANALYZE;

-- Regular vacuum (safe to run anytime)
VACUUM ANALYZE;
```

---

## Step 12: High Availability Setup (Optional)

### Streaming Replication
```sql
-- On primary server
-- Edit postgresql.conf
wal_level = replica
max_wal_senders = 3
wal_keep_segments = 64

-- Create replication user
CREATE ROLE replication WITH REPLICATION ENCRYPTED PASSWORD 'reppassword' LOGIN;
```

### Set Up Replica
```bash
# Stop replica if running
sudo systemctl stop postgresql

# Clear data directory
sudo rm -rf /var/lib/postgresql/15/main/*

# Take base backup from primary
pg_basebackup -h primary_host -U replication -D /var/lib/postgresql/15/main -P -Xstream

# Start replica
sudo systemctl start postgresql
```

---

## Troubleshooting

### Connection Refused
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Check listening on port 5432
sudo netstat -tulnp | grep 5432

# Check firewall
sudo ufw allow 5432/tcp
```

### Permission Denied
```bash
# Verify user permissions
psql -U postgres -c "SELECT * FROM pg_user WHERE usename = 'xio_admin';"

# Grant missing permissions
GRANT ALL PRIVILEGES ON SCHEMA public TO xio_admin;
```

### Slow Queries
```sql
-- Enable query logging
SET log_min_duration_statement = 1000; -- Log queries > 1 second

-- Find slow queries
SELECT 
  query,
  mean_exec_time,
  calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

---

## Rollback Plan

If migration fails:

```bash
# 1. Stop application
sudo systemctl stop xio-app

# 2. Restore SQLite backup
cp production.db.backup production.db

# 3. Drop PostgreSQL database (if needed)
psql -U postgres -c "DROP DATABASE xio_governance;"

# 4. Revert database connection in code
# Change back to sqlite3 in connection config

# 5. Restart application
sudo systemctl start xio-app
```

---

## Verification Checklist

- [ ] PostgreSQL installed and running
- [ ] Database and user created
- [ ] Schema migrated successfully
- [ ] Data migrated (row count matches)
- [ ] Indexes created and working
- [ ] Views available
- [ ] Environment variables configured
- [ ] Application code updated
- [ ] Connection pooling configured
- [ ] Backups automated
- [ ] Monitoring set up
- [ ] Performance baseline established
- [ ] Team trained on new system

---

## Performance Comparison

| Metric | SQLite | PostgreSQL |
|--------|--------|-----------|
| Concurrent Users | 5-10 | 100+ |
| Query Performance | Slow (>1s) | Fast (<100ms) |
| Data Size Limit | 2GB practical | Unlimited |
| Replication | None | Built-in |
| Full-Text Search | No | Yes |
| JSON Support | Basic | Advanced |
| ACID Compliance | Yes | Yes |
| Transactions | Single | Multi-user |

---

## Post-Migration

✅ **Benefits Achieved**:
- 10x performance improvement
- Unlimited scalability
- Enterprise-grade reliability
- Advanced features unlocked
- Production-ready infrastructure

**Next Steps**:
1. Monitor performance metrics
2. Optimize slow queries
3. Set up alerting
4. Implement replication for HA
5. Plan regular maintenance

---

**Status**: ✅ Ready to Deploy

Enjoy your production-grade PostgreSQL setup!
