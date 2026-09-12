# Database Connection Wrapper Guide

Complete database abstraction layer for federated learning platform with persistent storage.

## Overview

The database wrapper provides:
- **SQLite** (development) and **PostgreSQL** (production) support
- Connection pooling and resource management
- Type-safe data access layer
- Repository pattern for clean separation of concerns
- Automatic schema initialization

## Architecture

```
Application
    ↓
RepositoryManager (Facade)
    ├── SessionRepository
    ├── ClientRepository
    ├── TrainingRepository
    └── MetricsRepository
    ↓
DatabaseManager (Connection Pool)
    ├── SQLiteConnectionPool
    └── PostgreSQLConnectionPool
    ↓
Database (SQLite or PostgreSQL)
```

## Quick Start

### Initialize Database

```typescript
import { initializeDatabase, initializeRepository } from './src/db/database';
import { getRepository } from './src/db/repository';

// Initialize database
const db = await initializeDatabase({
  type: 'sqlite',  // or 'postgresql'
  database: 'federated_learning.db',
  filepath: './data/federated_learning.db'  // for SQLite
});

// Initialize repository layer
initializeRepository(db);

// Use throughout app
const repo = getRepository();
```

### Use Cases

#### Create Session

```typescript
const repo = getRepository();

const session = await repo.sessions.create(
  'session-1',           // sessionId
  'averaging',           // strategy
  Array(10).fill(0.1)    // initialWeights
);

console.log(session);
// {
//   sessionId: 'session-1',
//   strategy: 'averaging',
//   initialWeights: [0.1, 0.1, ...],
//   status: 'active',
//   clientCount: 0,
//   trainingRounds: 0,
//   communicationRounds: 0,
//   createdAt: Date,
//   updatedAt: Date
// }
```

#### Add Client

```typescript
const client = await repo.clients.add(
  'session-1',     // sessionId
  'client-1',      // clientId
  10,              // featuresCount
  50               // samplesCount
);
```

#### Record Training Round

```typescript
const trainingRound = await repo.training.recordRound(
  'session-1',    // sessionId
  1,              // round
  0.25,           // loss
  0.85,           // accuracy
  1500            // duration (ms)
);
```

#### Save Metrics

```typescript
const metrics = await repo.metrics.save(
  'session-1',              // sessionId
  [0.15, 0.12, ...],        // globalWeights
  5                         // communicationRounds
);
```

## Configuration

### SQLite (Development)

```typescript
const db = await initializeDatabase({
  type: 'sqlite',
  database: 'federated_learning.db',
  filepath: './data/federated_learning.db'
});
```

### PostgreSQL (Production)

```typescript
const db = await initializeDatabase({
  type: 'postgresql',
  host: 'localhost',
  port: 5432,
  database: 'federated_learning',
  username: 'postgres',
  password: 'password',
  maxConnections: 20,
  connectionTimeout: 2000
});
```

## Schema

### Sessions Table

```sql
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  sessionId TEXT UNIQUE NOT NULL,
  strategy TEXT NOT NULL,
  initialWeights TEXT NOT NULL,  -- JSON string
  status TEXT DEFAULT 'active',
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP,
  clientCount INTEGER DEFAULT 0,
  trainingRounds INTEGER DEFAULT 0,
  communicationRounds INTEGER DEFAULT 0
);

CREATE INDEX idx_sessions_status ON sessions(status);
```

### Clients Table

```sql
CREATE TABLE clients (
  id TEXT PRIMARY KEY,
  sessionId TEXT NOT NULL,
  clientId TEXT NOT NULL,
  featuresCount INTEGER NOT NULL,
  samplesCount INTEGER NOT NULL,
  createdAt TIMESTAMP,
  FOREIGN KEY (sessionId) REFERENCES sessions(sessionId)
);

CREATE INDEX idx_clients_sessionId ON clients(sessionId);
```

### Training History Table

```sql
CREATE TABLE training_history (
  id TEXT PRIMARY KEY,
  sessionId TEXT NOT NULL,
  round INTEGER NOT NULL,
  loss REAL NOT NULL,
  accuracy REAL NOT NULL,
  duration INTEGER NOT NULL,  -- milliseconds
  timestamp TIMESTAMP,
  FOREIGN KEY (sessionId) REFERENCES sessions(sessionId)
);

CREATE INDEX idx_training_history_sessionId ON training_history(sessionId);
CREATE INDEX idx_training_history_round ON training_history(round);
```

### Metrics Table

```sql
CREATE TABLE metrics (
  id TEXT PRIMARY KEY,
  sessionId TEXT NOT NULL,
  globalWeights TEXT NOT NULL,  -- JSON string
  communicationRounds INTEGER NOT NULL,
  timestamp TIMESTAMP,
  FOREIGN KEY (sessionId) REFERENCES sessions(sessionId)
);

CREATE INDEX idx_metrics_sessionId ON metrics(sessionId);
```

## API Reference

### DatabaseManager

Main database connection and operations manager.

```typescript
class DatabaseManager {
  // Connection
  async connect(): Promise<void>
  async close(): Promise<void>
  isConnected(): boolean
  
  // Sessions
  async createSession(session): Promise<SessionRecord>
  async getSession(sessionId): Promise<SessionRecord | null>
  async getAllSessions(): Promise<SessionRecord[]>
  async updateSession(sessionId, updates): Promise<void>
  async deleteSession(sessionId): Promise<void>
  
  // Clients
  async addClient(client): Promise<ClientRecord>
  async getClients(sessionId): Promise<ClientRecord[]>
  async deleteClient(sessionId, clientId): Promise<void>
  
  // Training History
  async recordTrainingRound(record): Promise<TrainingHistoryRecord>
  async getTrainingHistory(sessionId): Promise<TrainingHistoryRecord[]>
  
  // Metrics
  async recordMetrics(metrics): Promise<MetricsRecord>
  async getLatestMetrics(sessionId): Promise<MetricsRecord | null>
}
```

### RepositoryManager (Facade)

High-level data access layer.

```typescript
class RepositoryManager {
  sessions: SessionRepository
  clients: ClientRepository
  training: TrainingRepository
  metrics: MetricsRepository
}
```

### SessionRepository

```typescript
async create(sessionId, strategy, initialWeights): Promise<Session>
async getById(sessionId): Promise<Session | null>
async getAll(): Promise<Session[]>
async updateStatus(sessionId, status): Promise<void>
async updateMetrics(sessionId, clientCount, trainingRounds, communicationRounds): Promise<void>
async delete(sessionId): Promise<void>
```

### ClientRepository

```typescript
async add(sessionId, clientId, featuresCount, samplesCount): Promise<Client>
async getBySession(sessionId): Promise<Client[]>
async delete(sessionId, clientId): Promise<void>
async deleteAllInSession(sessionId): Promise<void>
```

### TrainingRepository

```typescript
async recordRound(sessionId, round, loss, accuracy, duration): Promise<TrainingRound>
async getHistory(sessionId): Promise<TrainingRound[]>
async getLastRound(sessionId): Promise<TrainingRound | null>
```

### MetricsRepository

```typescript
async save(sessionId, globalWeights, communicationRounds): Promise<Metrics>
async getLatest(sessionId): Promise<Metrics | null>
```

## Integration with API

### In API Server

```typescript
import { initializeDatabase, initializeRepository } from './db/database';
import { getRepository } from './db/repository';

// Initialize on startup
app.get('/health', async (req, res) => {
  const db = await initializeDatabase({
    type: process.env.DB_TYPE || 'sqlite',
    database: process.env.DB_NAME || 'federated.db',
    filepath: process.env.DB_PATH || './data/federated.db'
  });
  
  initializeRepository(db);
  
  res.json({ status: 'healthy', database: 'connected' });
});

// Use in routes
app.post('/federated/sessions', async (req, res) => {
  const repo = getRepository();
  
  const session = await repo.sessions.create(
    req.body.sessionId,
    req.body.strategy,
    req.body.initialWeights
  );
  
  res.json(session);
});
```

## Features

### Connection Pooling
- **SQLite**: Direct file-based connection
- **PostgreSQL**: Connection pool (default 20 connections)
- Automatic timeout management
- Connection reuse

### Type Safety
- Full TypeScript type definitions
- Type-safe queries through repository layer
- No raw SQL in application code

### Automatic Schema
- Schema created on first connection
- Idempotent table/index creation
- Foreign key constraints enabled

### Data Persistence
- All sessions, clients, training history, and metrics stored
- Can recover from application restart
- Historical data for analysis

### Scalability
- Connection pooling for concurrent requests
- Indexed queries for performance
- JSON storage for complex data (weights, metrics)

## Environment Variables

```bash
# Database type
DB_TYPE=sqlite  # or postgresql

# Database name/path
DB_NAME=federated_learning.db
DB_PATH=./data/federated_learning.db

# PostgreSQL specific
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=password
DB_MAX_CONNECTIONS=20
```

## Best Practices

1. **Always initialize database on startup**
   ```typescript
   const db = await initializeDatabase(config);
   initializeRepository(db);
   ```

2. **Use repository layer, not DatabaseManager directly**
   ```typescript
   // Good
   const repo = getRepository();
   await repo.sessions.create(...)
   
   // Avoid
   const db = getDatabase();
   await db.createSession(...)
   ```

3. **Handle errors**
   ```typescript
   try {
     const session = await repo.sessions.getById(sessionId);
     if (!session) {
       // Handle not found
     }
   } catch (err) {
     console.error('Database error:', err);
   }
   ```

4. **Close database on shutdown**
   ```typescript
   process.on('SIGTERM', async () => {
     const db = getDatabase();
     await db.close();
     process.exit(0);
   });
   ```

## Migration to PostgreSQL

When moving from SQLite to PostgreSQL:

1. Export data from SQLite
2. Create PostgreSQL database
3. Change configuration: `type: 'postgresql'`
4. Schema will be created automatically
5. Import data if needed

## Performance Considerations

- **Indexes**: All commonly queried fields indexed
- **Connection pooling**: Reuse connections across requests
- **JSON storage**: Efficient for flexible data (weights, metrics)
- **Batch operations**: Group updates when possible

## Testing

```typescript
import { initializeDatabase, initializeRepository } from './src/db/database';

// Test with in-memory SQLite
const db = await initializeDatabase({
  type: 'sqlite',
  database: ':memory:',
  filepath: ':memory:'
});

initializeRepository(db);

// Tests use the in-memory database
// Data is lost after test completes
```

## Future Enhancements

- [ ] Migrations system (Knex/TypeORM)
- [ ] Query builder for complex queries
- [ ] Caching layer (Redis)
- [ ] Replication/backup
- [ ] Archival of old sessions
- [ ] Full-text search on metrics

---

**Status:** Production-ready  
**Supported Databases:** SQLite, PostgreSQL  
**Connection Pool:** Yes  
**Type Safety:** Full TypeScript
