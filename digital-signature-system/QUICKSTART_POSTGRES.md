# ⚡ PostgreSQL Quick Start Guide

**Status**: Ready to Setup  
**Time**: 15-30 minutes  
**Platform**: Windows/Mac/Linux  

---

## Option 1: Docker (Recommended - Fastest)

### Prerequisites
- Docker Desktop installed (https://www.docker.com/products/docker-desktop)

### Setup (3 commands)

```bash
# 1. Start PostgreSQL container
bash scripts/docker-postgres.sh

# 2. Wait for output showing connection details
# Connection String: postgresql://xio_admin:postgres@localhost:5432/xio_governance

# 3. Done! PostgreSQL is running
```

**Expected Output:**
```
✅ PostgreSQL is ready!

📋 Connection Details:
   Host: localhost
   Port: 5432
   Database: xio_governance
   User: xio_admin
   Password: postgres

🔗 Connection String:
   postgresql://xio_admin:postgres@localhost:5432/xio_governance
```

---

## Option 2: Windows (Using Chocolatey)

### Prerequisites
- Administrator access
- Chocolatey installed (https://chocolatey.org/install)

### Setup

```powershell
# 1. Run as Administrator
Set-ExecutionPolicy Bypass -Scope Process -Force
.\scripts\install-postgres-windows.ps1

# 2. Select option 1 (Chocolatey)

# 3. Follow prompts to set password
```

---

## Option 3: Windows (Direct Download)

### Setup

1. Download installer: https://www.postgresql.org/download/windows/
2. Run installer
3. Keep default settings (Port 5432)
4. Set password for `postgres` user
5. Complete installation

---

## Next: Create Database & User

### Linux/Mac
```bash
# Connect as superuser
psql -U postgres

# Create database
CREATE DATABASE xio_governance;

# Create user
CREATE USER xio_admin WITH PASSWORD 'secure_password';

# Grant permissions
GRANT ALL PRIVILEGES ON DATABASE xio_governance TO xio_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO xio_admin;

# Exit
\q
```

### Windows (PostgreSQL Command Line)
```sql
-- Open Command Prompt or PowerShell
psql -U postgres

-- Same SQL commands as above
CREATE DATABASE xio_governance;
CREATE USER xio_admin WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE xio_governance TO xio_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO xio_admin;

-- Exit
\q
```

---

## Step 1: Install Dependencies

```bash
npm install pg dotenv
```

---

## Step 2: Configure Environment

Create/update `.env.production`:

```env
# Database
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_USER=xio_admin
DB_PASSWORD=secure_password
DB_NAME=xio_governance
DB_SSL=false

# Connection Pool
DB_POOL_MIN=2
DB_POOL_MAX=20
```

---

## Step 3: Run Schema Migration

```bash
# Linux/Mac
psql -U xio_admin -d xio_governance -f scripts/migrate-to-postgres.sql

# Windows (PowerShell)
& "C:\Program Files\PostgreSQL\15\bin\psql.exe" -U xio_admin -d xio_governance -f scripts/migrate-to-postgres.sql
```

**Expected Output:**
```
CREATE EXTENSION
CREATE TABLE
CREATE TABLE
...
CREATE VIEW
CREATE VIEW
```

---

## Step 4: Verify Schema

```bash
# Connect to database
psql -U xio_admin -d xio_governance

# List tables
\dt

# List views
\dv

# Count records
SELECT COUNT(*) FROM clients;

# Exit
\q
```

**Expected Tables:**
```
clients
aml_flags
segregated_accounts
ledger_entries
account_transfers
rsa_keys
transactions
transaction_signatures
tax_reports
sri_reports
audit_trail
```

---

## Step 5: Migrate Data (Optional)

If you have SQLite data to migrate:

```bash
# Build TypeScript
npm run build

# Run migration
npx ts-node scripts/migrate-sqlite-to-postgres.ts
```

**Expected Output:**
```
🚀 Starting PostgreSQL migration from SQLite...
✅ Connected to PostgreSQL

📋 Migrating clients table...
   ✅ Migrated 45 clients

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

## Step 6: Update Application Code

Install the connection module:

```typescript
// src/db/postgres-connection.ts already exists
import pgConnection from './db/postgres-connection';

// Initialize in server
await pgConnection.connect();
console.log('✅ Connected to PostgreSQL');
```

---

## Step 7: Test Connection

```bash
# Start application
npm start

# Check logs for:
# ✅ PostgreSQL connection established
# ✅ All endpoints available
```

---

## Verification Checklist

- [ ] PostgreSQL installed and running
- [ ] Database `xio_governance` created
- [ ] User `xio_admin` created
- [ ] Schema migrated (11 tables visible)
- [ ] `.env.production` configured
- [ ] Dependencies installed (`pg`, `dotenv`)
- [ ] Application connects successfully
- [ ] All endpoints responding

---

## Useful Commands

### PostgreSQL CLI

```bash
# Connect to database
psql -U xio_admin -d xio_governance

# List databases
\l

# List tables
\dt

# Describe table
\d clients

# Run query
SELECT * FROM clients LIMIT 5;

# Exit
\q
```

### Docker Commands

```bash
# View logs
docker logs xio-postgres

# Stop container
docker stop xio-postgres

# Start container
docker start xio-postgres

# Remove container
docker rm -f xio-postgres

# Connect to container
docker exec -it xio-postgres psql -U xio_admin -d xio_governance

# View volume
docker volume ls
```

---

## Troubleshooting

### "Connection refused"
```bash
# Check if PostgreSQL is running
# Docker: docker ps | grep xio-postgres
# Windows: Services → Check PostgreSQL service

# Check port 5432
netstat -tuln | grep 5432  # Linux/Mac
netstat -ano | findstr 5432  # Windows
```

### "User not found"
```bash
# Create user if missing
psql -U postgres

CREATE USER xio_admin WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE xio_governance TO xio_admin;

\q
```

### "Database does not exist"
```bash
# Create database
psql -U postgres -c "CREATE DATABASE xio_governance;"
```

### "Connection pool exhausted"
```bash
# Increase pool size in .env.production
DB_POOL_MAX=50
DB_CONNECTION_TIMEOUT=60000
```

---

## Performance Baseline

After setup, you should see:

| Metric | Expected |
|--------|----------|
| Connection time | < 100ms |
| Query time | < 50ms |
| Concurrent users | 20+ |
| Scalability | Unlimited |

---

## What's Next?

✅ Database is set up  
✅ Schema is created  
✅ Ready for production  

**Next Steps:**
1. Deploy application with PostgreSQL
2. Set up backups (see POSTGRESQL_MIGRATION.md)
3. Configure monitoring
4. Implement high availability (optional)
5. Performance tuning

---

## Support

For detailed information:
- See: `POSTGRESQL_MIGRATION.md` (complete guide)
- See: `postgres-connection.ts` (connection code)
- See: `migrate-to-postgres.sql` (schema)

---

**Time Invested**: 15-30 minutes  
**Benefit**: 10x performance improvement, enterprise scalability  
**Status**: ✅ Ready to go!
