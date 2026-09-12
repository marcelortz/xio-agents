-- PostgreSQL Migration Script
-- Migrate from SQLite to PostgreSQL for Production Governance System
-- Version: 1.0
-- Date: 2026-09-12

-- ════════════════════════════════════════════════════════════════════════════════
-- DATABASE CREATION
-- ════════════════════════════════════════════════════════════════════════════════

CREATE DATABASE IF NOT EXISTS xio_governance;
\c xio_governance

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ════════════════════════════════════════════════════════════════════════════════
-- LAYER 1: KYC/AML COMPLIANCE TABLES
-- ════════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clientId VARCHAR(50) UNIQUE NOT NULL,
  cedula VARCHAR(20) UNIQUE NOT NULL,
  fullName VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  address TEXT,
  kycStatus VARCHAR(20) DEFAULT 'PENDING', -- PENDING, VERIFIED, REJECTED, SUSPENDED
  amlStatus VARCHAR(20) DEFAULT 'CLEAN', -- CLEAN, FLAGGED, BLOCKED
  riskScore INTEGER DEFAULT 50, -- 0-100 scale
  verifiedAt TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_cedula (cedula),
  INDEX idx_kyc_status (kycStatus),
  INDEX idx_aml_status (amlStatus)
);

CREATE TABLE IF NOT EXISTS aml_flags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clientId UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  flagType VARCHAR(50) NOT NULL, -- SPIKE, CIRCULAR_FLOW, STRUCTURING
  severity VARCHAR(20) DEFAULT 'LOW', -- LOW, MEDIUM, HIGH, CRITICAL
  description TEXT,
  reportedToUIF BOOLEAN DEFAULT FALSE,
  uifReportId VARCHAR(50),
  uifReportedAt TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolvedAt TIMESTAMP,
  INDEX idx_client_id (clientId),
  INDEX idx_severity (severity)
);

-- ════════════════════════════════════════════════════════════════════════════════
-- LAYER 2: ACCOUNT SEGREGATION TABLES
-- ════════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS segregated_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  accountId VARCHAR(50) UNIQUE NOT NULL,
  accountNumber VARCHAR(30) NOT NULL,
  bankName VARCHAR(100) NOT NULL,
  accountType VARCHAR(20) NOT NULL, -- CLIENT, COMPANY, GUARANTEE, INSURANCE
  clientId VARCHAR(50),
  currency VARCHAR(3) DEFAULT 'EUR',
  balance DECIMAL(15,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, FROZEN, CLOSED
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_account_type (accountType),
  INDEX idx_status (status)
);

CREATE TABLE IF NOT EXISTS ledger_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ledgerId VARCHAR(50) UNIQUE NOT NULL,
  accountId UUID NOT NULL REFERENCES segregated_accounts(id) ON DELETE CASCADE,
  transactionType VARCHAR(30) NOT NULL, -- DEPOSIT, WITHDRAWAL, TRANSFER, GUARANTEE_ALLOCATION
  amount DECIMAL(15,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'EUR',
  description TEXT,
  balance DECIMAL(15,2) NOT NULL,
  proof VARCHAR(64) NOT NULL, -- SHA-256 hash
  status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, COMPLETED, FAILED
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_account_id (accountId),
  INDEX idx_transaction_type (transactionType)
);

CREATE TABLE IF NOT EXISTS account_transfers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transferId VARCHAR(50) UNIQUE NOT NULL,
  fromAccountId UUID NOT NULL REFERENCES segregated_accounts(id),
  toAccountId UUID NOT NULL REFERENCES segregated_accounts(id),
  amount DECIMAL(15,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'EUR',
  reason TEXT,
  status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, COMPLETED, FAILED
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completedAt TIMESTAMP,
  INDEX idx_from_account (fromAccountId),
  INDEX idx_to_account (toAccountId)
);

-- ════════════════════════════════════════════════════════════════════════════════
-- LAYER 3: RSA-2048 DIGITAL SIGNATURES TABLES
-- ════════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS rsa_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  keyId VARCHAR(50) UNIQUE NOT NULL,
  publicKey TEXT NOT NULL,
  privateKey TEXT NOT NULL,
  thumbprint VARCHAR(16) NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expiresAt TIMESTAMP NOT NULL,
  rotated BOOLEAN DEFAULT FALSE,
  INDEX idx_key_id (keyId),
  INDEX idx_expires_at (expiresAt)
);

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transactionId VARCHAR(50) UNIQUE NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'EUR',
  description TEXT,
  signatory VARCHAR(100),
  status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, APPROVED, EXECUTED, REJECTED
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  approvedAt TIMESTAMP,
  executedAt TIMESTAMP,
  rejectedAt TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_signatory (signatory)
);

CREATE TABLE IF NOT EXISTS transaction_signatures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  signatureId VARCHAR(50) UNIQUE NOT NULL,
  transactionId UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  keyId UUID NOT NULL REFERENCES rsa_keys(id),
  signature TEXT NOT NULL,
  proof VARCHAR(64) NOT NULL, -- SHA-256 hash
  signedBy VARCHAR(100) NOT NULL,
  signedAt TIMESTAMP NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  verifiedAt TIMESTAMP,
  INDEX idx_transaction_id (transactionId),
  INDEX idx_verified (verified)
);

-- ════════════════════════════════════════════════════════════════════════════════
-- TAX REPORTING TABLES
-- ════════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS tax_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  taxReportId VARCHAR(50) UNIQUE NOT NULL,
  transactionId VARCHAR(50) NOT NULL,
  grossAmount DECIMAL(15,2) NOT NULL,
  ivaAmount DECIMAL(15,2) NOT NULL,
  ivaRate DECIMAL(5,2) NOT NULL,
  retentionAmount DECIMAL(15,2) NOT NULL,
  retentionType VARCHAR(30) NOT NULL, -- SERVICE, GOODS, DIVIDEND
  netAmount DECIMAL(15,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'EUR',
  reportedToSRI BOOLEAN DEFAULT FALSE,
  sriReportId VARCHAR(50),
  sriReportedAt TIMESTAMP,
  signature TEXT NOT NULL,
  signedBy VARCHAR(100) NOT NULL,
  signedAt TIMESTAMP NOT NULL,
  proof VARCHAR(64) NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_transaction_id (transactionId),
  INDEX idx_reported_to_sri (reportedToSRI),
  INDEX idx_signed_at (signedAt)
);

CREATE TABLE IF NOT EXISTS sri_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sriReportId VARCHAR(50) UNIQUE NOT NULL,
  taxReportId UUID NOT NULL REFERENCES tax_reports(id) ON DELETE CASCADE,
  sriResponseCode VARCHAR(10),
  sriResponseMessage TEXT,
  sriReceiptNumber VARCHAR(50),
  sriProcessedAt TIMESTAMP,
  retryCount INTEGER DEFAULT 0,
  lastRetryAt TIMESTAMP,
  status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, ACCEPTED, REJECTED
  INDEX idx_status (status),
  INDEX idx_tax_report_id (taxReportId)
);

-- ════════════════════════════════════════════════════════════════════════════════
-- AUDIT & COMPLIANCE TABLES
-- ════════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS audit_trail (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auditId VARCHAR(50) UNIQUE NOT NULL,
  entityType VARCHAR(50) NOT NULL, -- CLIENT, ACCOUNT, TRANSACTION, TAX_REPORT
  entityId VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL, -- CREATE, UPDATE, DELETE, APPROVE, SIGN, REPORT
  details JSONB,
  actedBy VARCHAR(100),
  ipAddress VARCHAR(45),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  proof VARCHAR(64) NOT NULL, -- SHA-256 hash
  INDEX idx_entity_type (entityType),
  INDEX idx_entity_id (entityId),
  INDEX idx_timestamp (timestamp)
);

-- ════════════════════════════════════════════════════════════════════════════════
-- PERFORMANCE INDEXES
-- ════════════════════════════════════════════════════════════════════════════════

CREATE INDEX idx_clients_created_at ON clients(createdAt);
CREATE INDEX idx_ledger_created_at ON ledger_entries(createdAt);
CREATE INDEX idx_transactions_created_at ON transactions(createdAt);
CREATE INDEX idx_tax_reports_created_at ON tax_reports(createdAt);
CREATE INDEX idx_audit_trail_timestamp ON audit_trail(timestamp);

-- ════════════════════════════════════════════════════════════════════════════════
-- VIEWS FOR REPORTING
-- ════════════════════════════════════════════════════════════════════════════════

CREATE VIEW compliance_summary AS
SELECT
  (SELECT COUNT(*) FROM clients WHERE kycStatus = 'VERIFIED') as verified_clients,
  (SELECT COUNT(*) FROM clients WHERE amlStatus = 'FLAGGED') as flagged_clients,
  (SELECT COUNT(*) FROM segregated_accounts) as total_accounts,
  (SELECT SUM(balance) FROM segregated_accounts WHERE accountType = 'CLIENT') as client_aum,
  (SELECT SUM(balance) FROM segregated_accounts WHERE accountType = 'GUARANTEE') as guarantee_fund,
  (SELECT COUNT(*) FROM tax_reports WHERE reportedToSRI = TRUE) as sri_reported_count,
  (SELECT COUNT(*) FROM tax_reports WHERE reportedToSRI = FALSE) as sri_pending_count;

CREATE VIEW account_segregation_summary AS
SELECT
  accountType,
  COUNT(*) as account_count,
  SUM(balance) as total_balance,
  AVG(balance) as avg_balance,
  MAX(balance) as max_balance,
  MIN(balance) as min_balance
FROM segregated_accounts
WHERE status = 'ACTIVE'
GROUP BY accountType;

-- ════════════════════════════════════════════════════════════════════════════════
-- INITIAL CONFIGURATION
-- ════════════════════════════════════════════════════════════════════════════════

-- Enable row-level security if needed
-- ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE segregated_accounts ENABLE ROW LEVEL SECURITY;

-- Create sequence for IDs if needed
-- CREATE SEQUENCE client_id_seq START 1000;

COMMIT;

-- Display confirmation
SELECT 'PostgreSQL migration completed successfully!' as status;
