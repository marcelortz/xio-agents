import * as sqlite3 from 'sqlite3';
import { SignatureData } from '../crypto/digital-signature';

export interface Transaction {
  id: string;
  transactionId: string;
  amount: number;
  currency: string;
  description: string;
  signatory: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXECUTED';
  signature?: string;
  keyId?: string;
  algorithm?: string;
  createdAt: Date;
  approvedAt?: Date;
  executedAt?: Date;
  notes?: string;
}

export class TransactionsRepository {
  private db: sqlite3.Database;
  private initialized = false;

  constructor(dbPath: string = './transactions.db') {
    this.db = new sqlite3.Database(dbPath);
    this.db.configure('busyTimeout', 5000);
  }

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        this.db.run(`
          CREATE TABLE IF NOT EXISTS transactions (
            id TEXT PRIMARY KEY,
            transactionId TEXT UNIQUE NOT NULL,
            amount REAL NOT NULL,
            currency TEXT NOT NULL,
            description TEXT NOT NULL,
            signatory TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'PENDING',
            signature TEXT,
            keyId TEXT,
            algorithm TEXT,
            createdAt TEXT NOT NULL,
            approvedAt TEXT,
            executedAt TEXT,
            notes TEXT,
            CONSTRAINT amount_check CHECK (amount > 0)
          )
        `, (err) => {
          if (err) reject(err);
        });

        this.db.run(`
          CREATE TABLE IF NOT EXISTS audit_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            transactionId TEXT NOT NULL,
            action TEXT NOT NULL,
            actor TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            details TEXT,
            FOREIGN KEY(transactionId) REFERENCES transactions(transactionId)
          )
        `, (err) => {
          if (err) reject(err);
          else this.initialized = true;
          resolve();
        });
      });
    });
  }

  async createTransaction(
    transactionId: string,
    amount: number,
    currency: string,
    description: string,
    signatory: string,
    notes?: string
  ): Promise<Transaction> {
    return new Promise((resolve, reject) => {
      const id = `TXN-DB-${Date.now()}`;
      const createdAt = new Date().toISOString();

      this.db.run(
        `INSERT INTO transactions (
          id, transactionId, amount, currency, description, signatory, status, createdAt, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, transactionId, amount, currency, description, signatory, 'PENDING', createdAt, notes || null],
        function(err) {
          if (err) reject(err);
          else {
            resolve({
              id,
              transactionId,
              amount,
              currency,
              description,
              signatory,
              status: 'PENDING',
              createdAt: new Date(createdAt),
              notes,
            });
          }
        }
      );
    });
  }

  async approveAndSign(
    transactionId: string,
    signatureData: SignatureData
  ): Promise<Transaction> {
    return new Promise((resolve, reject) => {
      const approvedAt = new Date().toISOString();

      this.db.run(
        `UPDATE transactions
         SET status = ?, signature = ?, keyId = ?, algorithm = ?, approvedAt = ?
         WHERE transactionId = ?`,
        ['APPROVED', signatureData.signature, signatureData.keyId, signatureData.algorithm, approvedAt, transactionId],
        function(err) {
          if (err) reject(err);
          else {
            // Registrar en auditoría
            this.logAuditEntry(transactionId, 'APPROVED', 'SYSTEM', `Transacción firmada y aprobada`);
            resolve(this.getTransaction(transactionId) as any);
          }
        }
      );
    });
  }

  async rejectTransaction(transactionId: string, reason: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(
        `UPDATE transactions SET status = ? WHERE transactionId = ?`,
        ['REJECTED', transactionId],
        function(err) {
          if (err) reject(err);
          else {
            this.logAuditEntry(transactionId, 'REJECTED', 'SYSTEM', reason);
            resolve();
          }
        }
      );
    });
  }

  async executeTransaction(transactionId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const executedAt = new Date().toISOString();

      this.db.run(
        `UPDATE transactions SET status = ?, executedAt = ? WHERE transactionId = ?`,
        ['EXECUTED', executedAt, transactionId],
        function(err) {
          if (err) reject(err);
          else {
            this.logAuditEntry(transactionId, 'EXECUTED', 'SYSTEM', `Transacción ejecutada exitosamente`);
            resolve();
          }
        }
      );
    });
  }

  async getTransaction(transactionId: string): Promise<Transaction | null> {
    return new Promise((resolve, reject) => {
      this.db.get(
        `SELECT * FROM transactions WHERE transactionId = ?`,
        [transactionId],
        (err, row: any) => {
          if (err) reject(err);
          else if (!row) resolve(null);
          else {
            resolve({
              id: row.id,
              transactionId: row.transactionId,
              amount: row.amount,
              currency: row.currency,
              description: row.description,
              signatory: row.signatory,
              status: row.status,
              signature: row.signature,
              keyId: row.keyId,
              algorithm: row.algorithm,
              createdAt: new Date(row.createdAt),
              approvedAt: row.approvedAt ? new Date(row.approvedAt) : undefined,
              executedAt: row.executedAt ? new Date(row.executedAt) : undefined,
              notes: row.notes,
            });
          }
        }
      );
    });
  }

  async getPendingTransactions(): Promise<Transaction[]> {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT * FROM transactions WHERE status = ? ORDER BY createdAt DESC`,
        ['PENDING'],
        (err, rows: any[]) => {
          if (err) reject(err);
          else {
            resolve(rows.map(row => ({
              id: row.id,
              transactionId: row.transactionId,
              amount: row.amount,
              currency: row.currency,
              description: row.description,
              signatory: row.signatory,
              status: row.status,
              signature: row.signature,
              keyId: row.keyId,
              algorithm: row.algorithm,
              createdAt: new Date(row.createdAt),
              approvedAt: row.approvedAt ? new Date(row.approvedAt) : undefined,
              executedAt: row.executedAt ? new Date(row.executedAt) : undefined,
              notes: row.notes,
            })));
          }
        }
      );
    });
  }

  async getTransactionsByAmount(minAmount: number): Promise<Transaction[]> {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT * FROM transactions WHERE amount >= ? ORDER BY amount DESC, createdAt DESC`,
        [minAmount],
        (err, rows: any[]) => {
          if (err) reject(err);
          else {
            resolve(rows.map(row => ({
              id: row.id,
              transactionId: row.transactionId,
              amount: row.amount,
              currency: row.currency,
              description: row.description,
              signatory: row.signatory,
              status: row.status,
              signature: row.signature,
              keyId: row.keyId,
              algorithm: row.algorithm,
              createdAt: new Date(row.createdAt),
              approvedAt: row.approvedAt ? new Date(row.approvedAt) : undefined,
              executedAt: row.executedAt ? new Date(row.executedAt) : undefined,
              notes: row.notes,
            })));
          }
        }
      );
    });
  }

  async logAuditEntry(
    transactionId: string,
    action: string,
    actor: string,
    details: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const timestamp = new Date().toISOString();

      this.db.run(
        `INSERT INTO audit_log (transactionId, action, actor, timestamp, details)
         VALUES (?, ?, ?, ?, ?)`,
        [transactionId, action, actor, timestamp, details],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  async getAuditLog(transactionId: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT * FROM audit_log WHERE transactionId = ? ORDER BY timestamp ASC`,
        [transactionId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });
  }

  close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}

export default TransactionsRepository;
