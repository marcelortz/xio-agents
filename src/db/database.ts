/**
 * Database Connection Wrapper
 * Handles connection pooling, initialization, and query execution
 * Supports SQLite (development) and PostgreSQL (production)
 */

import * as sqlite3 from 'sqlite3';
import * as pool from 'pg';

// ============================================================================
// Types and Interfaces
// ============================================================================

export type DatabaseType = 'sqlite' | 'postgresql';

export interface DatabaseConfig {
  type: DatabaseType;
  host?: string;
  port?: number;
  database: string;
  username?: string;
  password?: string;
  filepath?: string;
  maxConnections?: number;
  connectionTimeout?: number;
}

export interface ConnectionPool {
  connect: () => Promise<void>;
  query: (sql: string, params?: any[]) => Promise<any>;
  all: (sql: string, params?: any[]) => Promise<any[]>;
  get: (sql: string, params?: any[]) => Promise<any>;
  run: (sql: string, params?: any[]) => Promise<any>;
  exec: (sql: string) => Promise<void>;
  close: () => Promise<void>;
  isConnected: () => boolean;
}

export interface SessionRecord {
  id: string;
  sessionId: string;
  strategy: string;
  initialWeights: string; // JSON string
  status: 'active' | 'training' | 'completed';
  createdAt: Date;
  updatedAt: Date;
  clientCount: number;
  trainingRounds: number;
  communicationRounds: number;
}

export interface ClientRecord {
  id: string;
  sessionId: string;
  clientId: string;
  featuresCount: number;
  samplesCount: number;
  createdAt: Date;
}

export interface TrainingHistoryRecord {
  id: string;
  sessionId: string;
  round: number;
  loss: number;
  accuracy: number;
  duration: number; // milliseconds
  timestamp: Date;
}

export interface MetricsRecord {
  id: string;
  sessionId: string;
  globalWeights: string; // JSON string
  communicationRounds: number;
  timestamp: Date;
}

// ============================================================================
// SQLite Connection Pool
// ============================================================================

class SQLiteConnectionPool implements ConnectionPool {
  private db: sqlite3.Database | null = null;
  private filepath: string;
  private connected: boolean = false;

  constructor(filepath: string) {
    this.filepath = filepath;
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.filepath, (err) => {
        if (err) {
          reject(new Error(`SQLite connection failed: ${err.message}`));
        } else {
          this.connected = true;
          // Enable foreign keys
          this.db!.run('PRAGMA foreign_keys = ON', (err) => {
            if (err) reject(err);
            else resolve();
          });
        }
      });
    });
  }

  async query(sql: string, params: any[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not connected'));
        return;
      }

      this.db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  }

  async all(sql: string, params: any[] = []): Promise<any[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not connected'));
        return;
      }

      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  async get(sql: string, params: any[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not connected'));
        return;
      }

      this.db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  async run(sql: string, params: any[] = []): Promise<any> {
    return this.query(sql, params);
  }

  async exec(sql: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not connected'));
        return;
      }

      this.db.exec(sql, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  async close(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) reject(err);
          else {
            this.connected = false;
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }

  isConnected(): boolean {
    return this.connected;
  }
}

// ============================================================================
// PostgreSQL Connection Pool
// ============================================================================

class PostgreSQLConnectionPool implements ConnectionPool {
  private pool: pool.Pool | null = null;
  private connected: boolean = false;

  constructor(config: Omit<DatabaseConfig, 'type'>) {
    this.pool = new pool.Pool({
      host: config.host || 'localhost',
      port: config.port || 5432,
      database: config.database,
      user: config.username,
      password: config.password,
      max: config.maxConnections || 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: config.connectionTimeout || 2000,
    });
  }

  async connect(): Promise<void> {
    try {
      const client = await this.pool!.connect();
      await client.query('SELECT NOW()');
      client.release();
      this.connected = true;
    } catch (err) {
      throw new Error(`PostgreSQL connection failed: ${err}`);
    }
  }

  async query(sql: string, params: any[] = []): Promise<any> {
    if (!this.pool) throw new Error('Database not connected');
    const result = await this.pool.query(sql, params);
    return result;
  }

  async all(sql: string, params: any[] = []): Promise<any[]> {
    if (!this.pool) throw new Error('Database not connected');
    const result = await this.pool.query(sql, params);
    return result.rows;
  }

  async get(sql: string, params: any[] = []): Promise<any> {
    if (!this.pool) throw new Error('Database not connected');
    const result = await this.pool.query(sql, params);
    return result.rows[0] || null;
  }

  async run(sql: string, params: any[] = []): Promise<any> {
    if (!this.pool) throw new Error('Database not connected');
    return this.pool.query(sql, params);
  }

  async exec(sql: string): Promise<void> {
    if (!this.pool) throw new Error('Database not connected');
    await this.pool.query(sql);
  }

  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.connected = false;
    }
  }

  isConnected(): boolean {
    return this.connected;
  }
}

// ============================================================================
// Database Manager
// ============================================================================

export class DatabaseManager {
  private pool: ConnectionPool | null = null;
  private config: DatabaseConfig;

  constructor(config: DatabaseConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    if (this.config.type === 'sqlite') {
      this.pool = new SQLiteConnectionPool(
        this.config.filepath || ':memory:'
      );
    } else if (this.config.type === 'postgresql') {
      this.pool = new PostgreSQLConnectionPool(this.config);
    } else {
      throw new Error(`Unsupported database type: ${this.config.type}`);
    }

    await this.pool.connect();
    await this.initializeSchema();
  }

  private async initializeSchema(): Promise<void> {
    if (!this.pool) throw new Error('Database not connected');

    const isSQLite = this.config.type === 'sqlite';

    // Create tables
    const sessionTable = isSQLite
      ? `
        CREATE TABLE IF NOT EXISTS sessions (
          id TEXT PRIMARY KEY,
          sessionId TEXT UNIQUE NOT NULL,
          strategy TEXT NOT NULL,
          initialWeights TEXT NOT NULL,
          status TEXT DEFAULT 'active',
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          clientCount INTEGER DEFAULT 0,
          trainingRounds INTEGER DEFAULT 0,
          communicationRounds INTEGER DEFAULT 0
        )
      `
      : `
        CREATE TABLE IF NOT EXISTS sessions (
          id TEXT PRIMARY KEY,
          sessionId TEXT UNIQUE NOT NULL,
          strategy TEXT NOT NULL,
          initialWeights TEXT NOT NULL,
          status TEXT DEFAULT 'active',
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          clientCount INTEGER DEFAULT 0,
          trainingRounds INTEGER DEFAULT 0,
          communicationRounds INTEGER DEFAULT 0
        )
      `;

    const clientTable = isSQLite
      ? `
        CREATE TABLE IF NOT EXISTS clients (
          id TEXT PRIMARY KEY,
          sessionId TEXT NOT NULL,
          clientId TEXT NOT NULL,
          featuresCount INTEGER NOT NULL,
          samplesCount INTEGER NOT NULL,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (sessionId) REFERENCES sessions(sessionId)
        )
      `
      : `
        CREATE TABLE IF NOT EXISTS clients (
          id TEXT PRIMARY KEY,
          sessionId TEXT NOT NULL,
          clientId TEXT NOT NULL,
          featuresCount INTEGER NOT NULL,
          samplesCount INTEGER NOT NULL,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (sessionId) REFERENCES sessions(sessionId)
        )
      `;

    const trainingHistoryTable = isSQLite
      ? `
        CREATE TABLE IF NOT EXISTS training_history (
          id TEXT PRIMARY KEY,
          sessionId TEXT NOT NULL,
          round INTEGER NOT NULL,
          loss REAL NOT NULL,
          accuracy REAL NOT NULL,
          duration INTEGER NOT NULL,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (sessionId) REFERENCES sessions(sessionId)
        )
      `
      : `
        CREATE TABLE IF NOT EXISTS training_history (
          id TEXT PRIMARY KEY,
          sessionId TEXT NOT NULL,
          round INTEGER NOT NULL,
          loss REAL NOT NULL,
          accuracy REAL NOT NULL,
          duration INTEGER NOT NULL,
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (sessionId) REFERENCES sessions(sessionId)
        )
      `;

    const metricsTable = isSQLite
      ? `
        CREATE TABLE IF NOT EXISTS metrics (
          id TEXT PRIMARY KEY,
          sessionId TEXT NOT NULL,
          globalWeights TEXT NOT NULL,
          communicationRounds INTEGER NOT NULL,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (sessionId) REFERENCES sessions(sessionId)
        )
      `
      : `
        CREATE TABLE IF NOT EXISTS metrics (
          id TEXT PRIMARY KEY,
          sessionId TEXT NOT NULL,
          globalWeights TEXT NOT NULL,
          communicationRounds INTEGER NOT NULL,
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (sessionId) REFERENCES sessions(sessionId)
        )
      `;

    // Create indexes
    const indexes = `
      CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
      CREATE INDEX IF NOT EXISTS idx_clients_sessionId ON clients(sessionId);
      CREATE INDEX IF NOT EXISTS idx_training_history_sessionId ON training_history(sessionId);
      CREATE INDEX IF NOT EXISTS idx_training_history_round ON training_history(round);
      CREATE INDEX IF NOT EXISTS idx_metrics_sessionId ON metrics(sessionId);
    `;

    await this.pool.exec(sessionTable);
    await this.pool.exec(clientTable);
    await this.pool.exec(trainingHistoryTable);
    await this.pool.exec(metricsTable);
    await this.pool.exec(indexes);

    console.log('Database schema initialized successfully');
  }

  // Session operations
  async createSession(session: Omit<SessionRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<SessionRecord> {
    if (!this.pool) throw new Error('Database not connected');

    const id = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();

    await this.pool.run(
      `INSERT INTO sessions (id, sessionId, strategy, initialWeights, status, createdAt, updatedAt, clientCount, trainingRounds, communicationRounds)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        session.sessionId,
        session.strategy,
        session.initialWeights,
        session.status,
        now,
        now,
        session.clientCount,
        session.trainingRounds,
        session.communicationRounds,
      ]
    );

    return { id, ...session, createdAt: now, updatedAt: now };
  }

  async getSession(sessionId: string): Promise<SessionRecord | null> {
    if (!this.pool) throw new Error('Database not connected');

    return this.pool.get(
      'SELECT * FROM sessions WHERE sessionId = ?',
      [sessionId]
    );
  }

  async getAllSessions(): Promise<SessionRecord[]> {
    if (!this.pool) throw new Error('Database not connected');

    return this.pool.all('SELECT * FROM sessions ORDER BY createdAt DESC');
  }

  async updateSession(sessionId: string, updates: Partial<SessionRecord>): Promise<void> {
    if (!this.pool) throw new Error('Database not connected');

    const fields = Object.keys(updates)
      .filter(key => key !== 'id' && key !== 'sessionId' && key !== 'createdAt')
      .map(key => `${key} = ?`);

    const values = Object.keys(updates)
      .filter(key => key !== 'id' && key !== 'sessionId' && key !== 'createdAt')
      .map(key => updates[key as keyof SessionRecord]);

    values.push(new Date()); // updatedAt
    values.push(sessionId);

    if (fields.length > 0) {
      await this.pool.run(
        `UPDATE sessions SET ${fields.join(', ')}, updatedAt = ? WHERE sessionId = ?`,
        values
      );
    }
  }

  async deleteSession(sessionId: string): Promise<void> {
    if (!this.pool) throw new Error('Database not connected');

    await this.pool.run('DELETE FROM sessions WHERE sessionId = ?', [sessionId]);
  }

  // Client operations
  async addClient(client: Omit<ClientRecord, 'id' | 'createdAt'>): Promise<ClientRecord> {
    if (!this.pool) throw new Error('Database not connected');

    const id = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();

    await this.pool.run(
      `INSERT INTO clients (id, sessionId, clientId, featuresCount, samplesCount, createdAt)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, client.sessionId, client.clientId, client.featuresCount, client.samplesCount, now]
    );

    return { id, ...client, createdAt: now };
  }

  async getClients(sessionId: string): Promise<ClientRecord[]> {
    if (!this.pool) throw new Error('Database not connected');

    return this.pool.all(
      'SELECT * FROM clients WHERE sessionId = ? ORDER BY createdAt',
      [sessionId]
    );
  }

  async deleteClient(sessionId: string, clientId: string): Promise<void> {
    if (!this.pool) throw new Error('Database not connected');

    await this.pool.run(
      'DELETE FROM clients WHERE sessionId = ? AND clientId = ?',
      [sessionId, clientId]
    );
  }

  // Training history operations
  async recordTrainingRound(record: Omit<TrainingHistoryRecord, 'id'>): Promise<TrainingHistoryRecord> {
    if (!this.pool) throw new Error('Database not connected');

    const id = `training_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await this.pool.run(
      `INSERT INTO training_history (id, sessionId, round, loss, accuracy, duration, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        record.sessionId,
        record.round,
        record.loss,
        record.accuracy,
        record.duration,
        record.timestamp,
      ]
    );

    return { id, ...record };
  }

  async getTrainingHistory(sessionId: string): Promise<TrainingHistoryRecord[]> {
    if (!this.pool) throw new Error('Database not connected');

    return this.pool.all(
      'SELECT * FROM training_history WHERE sessionId = ? ORDER BY round ASC',
      [sessionId]
    );
  }

  // Metrics operations
  async recordMetrics(metrics: Omit<MetricsRecord, 'id'>): Promise<MetricsRecord> {
    if (!this.pool) throw new Error('Database not connected');

    const id = `metrics_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await this.pool.run(
      `INSERT INTO metrics (id, sessionId, globalWeights, communicationRounds, timestamp)
       VALUES (?, ?, ?, ?, ?)`,
      [
        id,
        metrics.sessionId,
        metrics.globalWeights,
        metrics.communicationRounds,
        metrics.timestamp,
      ]
    );

    return { id, ...metrics };
  }

  async getLatestMetrics(sessionId: string): Promise<MetricsRecord | null> {
    if (!this.pool) throw new Error('Database not connected');

    return this.pool.get(
      'SELECT * FROM metrics WHERE sessionId = ? ORDER BY timestamp DESC LIMIT 1',
      [sessionId]
    );
  }

  // Connection management
  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.close();
    }
  }

  isConnected(): boolean {
    return this.pool?.isConnected() ?? false;
  }

  getPool(): ConnectionPool | null {
    return this.pool;
  }
}

// ============================================================================
// Singleton instance
// ============================================================================

let databaseInstance: DatabaseManager | null = null;

export async function initializeDatabase(config: DatabaseConfig): Promise<DatabaseManager> {
  if (databaseInstance) {
    return databaseInstance;
  }

  databaseInstance = new DatabaseManager(config);
  await databaseInstance.connect();
  return databaseInstance;
}

export function getDatabase(): DatabaseManager {
  if (!databaseInstance) {
    throw new Error('Database not initialized. Call initializeDatabase first.');
  }
  return databaseInstance;
}
