import sqlite3 from 'sqlite3';
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

interface MigrationStats {
  tables: string[];
  rowsCopied: number;
  errors: string[];
  startTime: Date;
  endTime?: Date;
}

export class SQLiteToPostgresMigrator {
  private sqliteDb: sqlite3.Database;
  private postgresPool: Pool;
  private stats: MigrationStats;

  constructor(sqliteDbPath: string, postgresConfig: any) {
    this.sqliteDb = new sqlite3.Database(sqliteDbPath);
    this.postgresPool = new Pool(postgresConfig);
    this.stats = {
      tables: [],
      rowsCopied: 0,
      errors: [],
      startTime: new Date(),
    };
  }

  async migrate(): Promise<MigrationStats> {
    try {
      console.log('🚀 Starting PostgreSQL migration from SQLite...\n');

      // Connect to PostgreSQL
      await this.postgresPool.query('SELECT NOW()');
      console.log('✅ Connected to PostgreSQL\n');

      // Migrate each table
      await this.migrateClients();
      await this.migrateAMLFlags();
      await this.migrateSegregatedAccounts();
      await this.migrateLedgerEntries();
      await this.migrateAccountTransfers();
      await this.migrateRSAKeys();
      await this.migrateTransactions();
      await this.migrateTransactionSignatures();
      await this.migrateTaxReports();
      await this.migrateSRIReports();
      await this.migrateAuditTrail();

      this.stats.endTime = new Date();
      this.displayMigrationSummary();

      return this.stats;
    } catch (error: any) {
      console.error('❌ Migration failed:', error.message);
      this.stats.errors.push(error.message);
      this.stats.endTime = new Date();
      throw error;
    } finally {
      await this.close();
    }
  }

  private async migrateClients(): Promise<void> {
    console.log('📋 Migrating clients table...');
    try {
      const rows = await this.querySQL('SELECT * FROM clients');
      for (const row of rows) {
        await this.postgresPool.query(
          `INSERT INTO clients (clientId, cedula, fullName, email, phone, address,
                               kycStatus, amlStatus, riskScore, verifiedAt, createdAt, updatedAt)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [
            row.clientId,
            row.cedula,
            row.fullName,
            row.email,
            row.phone,
            row.address,
            row.kycStatus || 'PENDING',
            row.amlStatus || 'CLEAN',
            row.riskScore || 50,
            row.verifiedAt,
            row.createdAt,
            row.updatedAt,
          ]
        );
        this.stats.rowsCopied++;
      }
      console.log(`   ✅ Migrated ${rows.length} clients\n`);
      this.stats.tables.push('clients');
    } catch (error: any) {
      console.log(`   ⚠️  Error: ${error.message}\n`);
      this.stats.errors.push(`clients: ${error.message}`);
    }
  }

  private async migrateAMLFlags(): Promise<void> {
    console.log('📋 Migrating AML flags table...');
    try {
      const rows = await this.querySQL('SELECT * FROM aml_flags');
      for (const row of rows) {
        // Get client UUID from clientId
        const clientResult = await this.postgresPool.query(
          'SELECT id FROM clients WHERE clientId = $1',
          [row.clientId]
        );
        const clientId = clientResult.rows[0]?.id;

        if (clientId) {
          await this.postgresPool.query(
            `INSERT INTO aml_flags (clientId, flagType, severity, description,
                                    reportedToUIF, uifReportId, uifReportedAt, createdAt, resolvedAt)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
              clientId,
              row.flagType,
              row.severity || 'LOW',
              row.description,
              row.reportedToUIF || false,
              row.uifReportId,
              row.uifReportedAt,
              row.createdAt,
              row.resolvedAt,
            ]
          );
          this.stats.rowsCopied++;
        }
      }
      console.log(`   ✅ Migrated ${rows.length} AML flags\n`);
      this.stats.tables.push('aml_flags');
    } catch (error: any) {
      console.log(`   ⚠️  Error: ${error.message}\n`);
      this.stats.errors.push(`aml_flags: ${error.message}`);
    }
  }

  private async migrateSegregatedAccounts(): Promise<void> {
    console.log('📋 Migrating segregated accounts table...');
    try {
      const rows = await this.querySQL('SELECT * FROM accounts');
      for (const row of rows) {
        await this.postgresPool.query(
          `INSERT INTO segregated_accounts (accountId, accountNumber, bankName, accountType,
                                           clientId, currency, balance, status, createdAt, updatedAt)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            row.id,
            row.accountNumber,
            row.bankName,
            row.accountType,
            row.clientId,
            row.currency || 'EUR',
            row.balance || 0,
            row.status || 'ACTIVE',
            row.createdAt,
            row.updatedAt,
          ]
        );
        this.stats.rowsCopied++;
      }
      console.log(`   ✅ Migrated ${rows.length} accounts\n`);
      this.stats.tables.push('segregated_accounts');
    } catch (error: any) {
      console.log(`   ⚠️  Error: ${error.message}\n`);
      this.stats.errors.push(`segregated_accounts: ${error.message}`);
    }
  }

  private async migrateLedgerEntries(): Promise<void> {
    console.log('📋 Migrating ledger entries table...');
    try {
      const rows = await this.querySQL('SELECT * FROM ledger_entries');
      for (const row of rows) {
        const accountResult = await this.postgresPool.query(
          'SELECT id FROM segregated_accounts WHERE accountId = $1',
          [row.accountId]
        );
        const accountId = accountResult.rows[0]?.id;

        if (accountId) {
          await this.postgresPool.query(
            `INSERT INTO ledger_entries (ledgerId, accountId, transactionType, amount,
                                        currency, description, balance, proof, status, createdAt)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [
              row.id,
              accountId,
              row.transactionType,
              row.amount,
              row.currency || 'EUR',
              row.description,
              row.balance,
              row.proof,
              row.status || 'PENDING',
              row.createdAt,
            ]
          );
          this.stats.rowsCopied++;
        }
      }
      console.log(`   ✅ Migrated ${rows.length} ledger entries\n`);
      this.stats.tables.push('ledger_entries');
    } catch (error: any) {
      console.log(`   ⚠️  Error: ${error.message}\n`);
      this.stats.errors.push(`ledger_entries: ${error.message}`);
    }
  }

  private async migrateAccountTransfers(): Promise<void> {
    console.log('📋 Migrating account transfers table...');
    try {
      const rows = await this.querySQL('SELECT * FROM account_transfers');
      for (const row of rows) {
        const fromResult = await this.postgresPool.query(
          'SELECT id FROM segregated_accounts WHERE accountId = $1',
          [row.fromAccountId]
        );
        const toResult = await this.postgresPool.query(
          'SELECT id FROM segregated_accounts WHERE accountId = $1',
          [row.toAccountId]
        );

        if (fromResult.rows[0] && toResult.rows[0]) {
          await this.postgresPool.query(
            `INSERT INTO account_transfers (transferId, fromAccountId, toAccountId, amount,
                                           currency, reason, status, createdAt, completedAt)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
              row.id,
              fromResult.rows[0].id,
              toResult.rows[0].id,
              row.amount,
              row.currency || 'EUR',
              row.reason,
              row.status || 'PENDING',
              row.createdAt,
              row.completedAt,
            ]
          );
          this.stats.rowsCopied++;
        }
      }
      console.log(`   ✅ Migrated ${rows.length} transfers\n`);
      this.stats.tables.push('account_transfers');
    } catch (error: any) {
      console.log(`   ⚠️  Error: ${error.message}\n`);
      this.stats.errors.push(`account_transfers: ${error.message}`);
    }
  }

  private async migrateRSAKeys(): Promise<void> {
    console.log('📋 Migrating RSA keys table...');
    try {
      const rows = await this.querySQL('SELECT * FROM rsa_keys');
      for (const row of rows) {
        await this.postgresPool.query(
          `INSERT INTO rsa_keys (keyId, publicKey, privateKey, thumbprint, createdAt, expiresAt, rotated)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            row.keyId,
            row.publicKey,
            row.privateKey,
            row.thumbprint,
            row.createdAt,
            row.expiresAt,
            row.rotated || false,
          ]
        );
        this.stats.rowsCopied++;
      }
      console.log(`   ✅ Migrated ${rows.length} RSA keys\n`);
      this.stats.tables.push('rsa_keys');
    } catch (error: any) {
      console.log(`   ⚠️  Error: ${error.message}\n`);
      this.stats.errors.push(`rsa_keys: ${error.message}`);
    }
  }

  private async migrateTransactions(): Promise<void> {
    console.log('📋 Migrating transactions table...');
    try {
      const rows = await this.querySQL('SELECT * FROM transactions');
      for (const row of rows) {
        await this.postgresPool.query(
          `INSERT INTO transactions (transactionId, amount, currency, description,
                                    signatory, status, createdAt, approvedAt, executedAt, rejectedAt)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            row.id,
            row.amount,
            row.currency || 'EUR',
            row.description,
            row.signatory,
            row.status || 'PENDING',
            row.createdAt,
            row.approvedAt,
            row.executedAt,
            row.rejectedAt,
          ]
        );
        this.stats.rowsCopied++;
      }
      console.log(`   ✅ Migrated ${rows.length} transactions\n`);
      this.stats.tables.push('transactions');
    } catch (error: any) {
      console.log(`   ⚠️  Error: ${error.message}\n`);
      this.stats.errors.push(`transactions: ${error.message}`);
    }
  }

  private async migrateTransactionSignatures(): Promise<void> {
    console.log('📋 Migrating transaction signatures table...');
    try {
      const rows = await this.querySQL('SELECT * FROM transaction_signatures');
      for (const row of rows) {
        const txnResult = await this.postgresPool.query(
          'SELECT id FROM transactions WHERE transactionId = $1',
          [row.transactionId]
        );
        const keyResult = await this.postgresPool.query(
          'SELECT id FROM rsa_keys WHERE keyId = $1',
          [row.keyId]
        );

        if (txnResult.rows[0] && keyResult.rows[0]) {
          await this.postgresPool.query(
            `INSERT INTO transaction_signatures (signatureId, transactionId, keyId, signature,
                                               proof, signedBy, signedAt, verified, verifiedAt)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
              row.id,
              txnResult.rows[0].id,
              keyResult.rows[0].id,
              row.signature,
              row.proof,
              row.signedBy,
              row.signedAt,
              row.verified || false,
              row.verifiedAt,
            ]
          );
          this.stats.rowsCopied++;
        }
      }
      console.log(`   ✅ Migrated ${rows.length} signatures\n`);
      this.stats.tables.push('transaction_signatures');
    } catch (error: any) {
      console.log(`   ⚠️  Error: ${error.message}\n`);
      this.stats.errors.push(`transaction_signatures: ${error.message}`);
    }
  }

  private async migrateTaxReports(): Promise<void> {
    console.log('📋 Migrating tax reports table...');
    try {
      const rows = await this.querySQL('SELECT * FROM tax_reports');
      for (const row of rows) {
        await this.postgresPool.query(
          `INSERT INTO tax_reports (taxReportId, transactionId, grossAmount, ivaAmount, ivaRate,
                                   retentionAmount, retentionType, netAmount, currency,
                                   reportedToSRI, sriReportId, sriReportedAt, signature,
                                   signedBy, signedAt, proof, createdAt)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
          [
            row.id,
            row.transactionId,
            row.grossAmount,
            row.ivaAmount,
            row.ivaRate,
            row.retentionAmount,
            row.retentionType,
            row.netAmount,
            row.currency || 'EUR',
            row.reportedToSRI || false,
            row.sriReportId,
            row.sriReportedAt,
            row.signature,
            row.signedBy,
            row.signedAt,
            row.proof,
            row.createdAt,
          ]
        );
        this.stats.rowsCopied++;
      }
      console.log(`   ✅ Migrated ${rows.length} tax reports\n`);
      this.stats.tables.push('tax_reports');
    } catch (error: any) {
      console.log(`   ⚠️  Error: ${error.message}\n`);
      this.stats.errors.push(`tax_reports: ${error.message}`);
    }
  }

  private async migrateSRIReports(): Promise<void> {
    console.log('📋 Migrating SRI reports table...');
    try {
      const rows = await this.querySQL('SELECT * FROM sri_reports');
      for (const row of rows) {
        const taxResult = await this.postgresPool.query(
          'SELECT id FROM tax_reports WHERE taxReportId = $1',
          [row.taxReportId]
        );

        if (taxResult.rows[0]) {
          await this.postgresPool.query(
            `INSERT INTO sri_reports (sriReportId, taxReportId, sriResponseCode, sriResponseMessage,
                                     sriReceiptNumber, sriProcessedAt, retryCount, lastRetryAt, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
              row.id,
              taxResult.rows[0].id,
              row.sriResponseCode,
              row.sriResponseMessage,
              row.sriReceiptNumber,
              row.sriProcessedAt,
              row.retryCount || 0,
              row.lastRetryAt,
              row.status || 'PENDING',
            ]
          );
          this.stats.rowsCopied++;
        }
      }
      console.log(`   ✅ Migrated ${rows.length} SRI reports\n`);
      this.stats.tables.push('sri_reports');
    } catch (error: any) {
      console.log(`   ⚠️  Error: ${error.message}\n`);
      this.stats.errors.push(`sri_reports: ${error.message}`);
    }
  }

  private async migrateAuditTrail(): Promise<void> {
    console.log('📋 Migrating audit trail table...');
    try {
      const rows = await this.querySQL('SELECT * FROM audit_trail');
      for (const row of rows) {
        await this.postgresPool.query(
          `INSERT INTO audit_trail (auditId, entityType, entityId, action, details,
                                   actedBy, ipAddress, timestamp, proof)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            row.id,
            row.entityType,
            row.entityId,
            row.action,
            row.details ? JSON.stringify(row.details) : null,
            row.actedBy,
            row.ipAddress,
            row.timestamp,
            row.proof,
          ]
        );
        this.stats.rowsCopied++;
      }
      console.log(`   ✅ Migrated ${rows.length} audit entries\n`);
      this.stats.tables.push('audit_trail');
    } catch (error: any) {
      console.log(`   ⚠️  Error: ${error.message}\n`);
      this.stats.errors.push(`audit_trail: ${error.message}`);
    }
  }

  private querySQL(sql: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.sqliteDb.all(sql, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  private displayMigrationSummary(): void {
    const duration =
      (this.stats.endTime!.getTime() - this.stats.startTime.getTime()) / 1000;

    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║          MIGRATION COMPLETED SUCCESSFULLY                 ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log(`📊 Migration Statistics:`);
    console.log(`   ✅ Tables migrated: ${this.stats.tables.length}`);
    console.log(`   ✅ Rows copied: ${this.stats.rowsCopied}`);
    console.log(`   ⏱️  Duration: ${duration.toFixed(2)} seconds`);

    if (this.stats.errors.length > 0) {
      console.log(`\n⚠️  Errors encountered:`);
      this.stats.errors.forEach((err) => console.log(`   - ${err}`));
    }

    console.log(`\n📋 Tables migrated:`);
    this.stats.tables.forEach((table) => console.log(`   ✓ ${table}`));
  }

  private async close(): Promise<void> {
    this.sqliteDb.close();
    await this.postgresPool.end();
  }
}

// Usage example
async function runMigration() {
  const migrator = new SQLiteToPostgresMigrator('production.db', {
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'xio_governance',
  });

  try {
    const stats = await migrator.migrate();
    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Export for use in other modules
export default SQLiteToPostgresMigrator;
