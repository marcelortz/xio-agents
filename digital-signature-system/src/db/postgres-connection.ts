import { Pool, QueryResult } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

export class PostgresConnection {
  private pool: Pool;
  private connected = false;

  constructor() {
    this.pool = new Pool({
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'xio_governance',
    });

    this.pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }

  async connect(): Promise<void> {
    try {
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      this.connected = true;
      console.log('✅ PostgreSQL connection established');
    } catch (error: any) {
      console.error('❌ PostgreSQL connection failed:', error.message);
      throw error;
    }
  }

  async query(text: string, params?: any[]): Promise<QueryResult> {
    if (!this.connected) {
      throw new Error('Database connection not established');
    }
    return this.pool.query(text, params);
  }

  async close(): Promise<void> {
    await this.pool.end();
    this.connected = false;
    console.log('✅ PostgreSQL connection closed');
  }

  isConnected(): boolean {
    return this.connected;
  }

  getPool(): Pool {
    return this.pool;
  }
}

export default new PostgresConnection();
