/**
 * Repository Layer
 * High-level data access layer for federated learning operations
 */

import { DatabaseManager, SessionRecord, ClientRecord, TrainingHistoryRecord, MetricsRecord } from './database';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// Types
// ============================================================================

export interface Session {
  sessionId: string;
  strategy: string;
  initialWeights: number[];
  status: 'active' | 'training' | 'completed';
  clientCount: number;
  trainingRounds: number;
  communicationRounds: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Client {
  sessionId: string;
  clientId: string;
  featuresCount: number;
  samplesCount: number;
  createdAt: Date;
}

export interface TrainingRound {
  sessionId: string;
  round: number;
  loss: number;
  accuracy: number;
  duration: number;
  timestamp: Date;
}

export interface Metrics {
  sessionId: string;
  globalWeights: number[];
  communicationRounds: number;
  timestamp: Date;
}

// ============================================================================
// Session Repository
// ============================================================================

export class SessionRepository {
  constructor(private db: DatabaseManager) {}

  async create(
    sessionId: string,
    strategy: string,
    initialWeights: number[]
  ): Promise<Session> {
    const record = await this.db.createSession({
      sessionId,
      strategy,
      initialWeights: JSON.stringify(initialWeights),
      status: 'active',
      clientCount: 0,
      trainingRounds: 0,
      communicationRounds: 0,
    });

    return this.recordToSession(record);
  }

  async getById(sessionId: string): Promise<Session | null> {
    const record = await this.db.getSession(sessionId);
    if (!record) return null;
    return this.recordToSession(record);
  }

  async getAll(): Promise<Session[]> {
    const records = await this.db.getAllSessions();
    return records.map(record => this.recordToSession(record));
  }

  async updateStatus(sessionId: string, status: 'active' | 'training' | 'completed'): Promise<void> {
    await this.db.updateSession(sessionId, { status });
  }

  async updateMetrics(
    sessionId: string,
    clientCount: number,
    trainingRounds: number,
    communicationRounds: number
  ): Promise<void> {
    await this.db.updateSession(sessionId, {
      clientCount,
      trainingRounds,
      communicationRounds,
    });
  }

  async delete(sessionId: string): Promise<void> {
    await this.db.deleteSession(sessionId);
  }

  private recordToSession(record: SessionRecord): Session {
    return {
      sessionId: record.sessionId,
      strategy: record.strategy,
      initialWeights: JSON.parse(record.initialWeights),
      status: record.status,
      clientCount: record.clientCount,
      trainingRounds: record.trainingRounds,
      communicationRounds: record.communicationRounds,
      createdAt: new Date(record.createdAt),
      updatedAt: new Date(record.updatedAt),
    };
  }
}

// ============================================================================
// Client Repository
// ============================================================================

export class ClientRepository {
  constructor(private db: DatabaseManager) {}

  async add(
    sessionId: string,
    clientId: string,
    featuresCount: number,
    samplesCount: number
  ): Promise<Client> {
    const record = await this.db.addClient({
      sessionId,
      clientId,
      featuresCount,
      samplesCount,
    });

    return this.recordToClient(record);
  }

  async getBySession(sessionId: string): Promise<Client[]> {
    const records = await this.db.getClients(sessionId);
    return records.map(record => this.recordToClient(record));
  }

  async delete(sessionId: string, clientId: string): Promise<void> {
    await this.db.deleteClient(sessionId, clientId);
  }

  async deleteAllInSession(sessionId: string): Promise<void> {
    const clients = await this.getBySession(sessionId);
    for (const client of clients) {
      await this.delete(sessionId, client.clientId);
    }
  }

  private recordToClient(record: ClientRecord): Client {
    return {
      sessionId: record.sessionId,
      clientId: record.clientId,
      featuresCount: record.featuresCount,
      samplesCount: record.samplesCount,
      createdAt: new Date(record.createdAt),
    };
  }
}

// ============================================================================
// Training Repository
// ============================================================================

export class TrainingRepository {
  constructor(private db: DatabaseManager) {}

  async recordRound(
    sessionId: string,
    round: number,
    loss: number,
    accuracy: number,
    duration: number
  ): Promise<TrainingRound> {
    const record = await this.db.recordTrainingRound({
      sessionId,
      round,
      loss,
      accuracy,
      duration,
      timestamp: new Date(),
    });

    return this.recordToTrainingRound(record);
  }

  async getHistory(sessionId: string): Promise<TrainingRound[]> {
    const records = await this.db.getTrainingHistory(sessionId);
    return records.map(record => this.recordToTrainingRound(record));
  }

  async getLastRound(sessionId: string): Promise<TrainingRound | null> {
    const history = await this.getHistory(sessionId);
    return history[history.length - 1] || null;
  }

  private recordToTrainingRound(record: TrainingHistoryRecord): TrainingRound {
    return {
      sessionId: record.sessionId,
      round: record.round,
      loss: record.loss,
      accuracy: record.accuracy,
      duration: record.duration,
      timestamp: new Date(record.timestamp),
    };
  }
}

// ============================================================================
// Metrics Repository
// ============================================================================

export class MetricsRepository {
  constructor(private db: DatabaseManager) {}

  async save(
    sessionId: string,
    globalWeights: number[],
    communicationRounds: number
  ): Promise<Metrics> {
    const record = await this.db.recordMetrics({
      sessionId,
      globalWeights: JSON.stringify(globalWeights),
      communicationRounds,
      timestamp: new Date(),
    });

    return this.recordToMetrics(record);
  }

  async getLatest(sessionId: string): Promise<Metrics | null> {
    const record = await this.db.getLatestMetrics(sessionId);
    if (!record) return null;
    return this.recordToMetrics(record);
  }

  private recordToMetrics(record: MetricsRecord): Metrics {
    return {
      sessionId: record.sessionId,
      globalWeights: JSON.parse(record.globalWeights),
      communicationRounds: record.communicationRounds,
      timestamp: new Date(record.timestamp),
    };
  }
}

// ============================================================================
// Repository Manager (Facade)
// ============================================================================

export class RepositoryManager {
  readonly sessions: SessionRepository;
  readonly clients: ClientRepository;
  readonly training: TrainingRepository;
  readonly metrics: MetricsRepository;

  constructor(db: DatabaseManager) {
    this.sessions = new SessionRepository(db);
    this.clients = new ClientRepository(db);
    this.training = new TrainingRepository(db);
    this.metrics = new MetricsRepository(db);
  }
}

// ============================================================================
// Singleton instance
// ============================================================================

let repositoryInstance: RepositoryManager | null = null;

export function initializeRepository(db: DatabaseManager): RepositoryManager {
  if (repositoryInstance) {
    return repositoryInstance;
  }

  repositoryInstance = new RepositoryManager(db);
  return repositoryInstance;
}

export function getRepository(): RepositoryManager {
  if (!repositoryInstance) {
    throw new Error('Repository not initialized. Call initializeRepository first.');
  }
  return repositoryInstance;
}
