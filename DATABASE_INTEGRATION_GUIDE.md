# Database Integration with REST API

Guide to integrate the database layer with federated-learning-api.ts for persistent storage.

## Overview

Currently, the API stores sessions in memory. This guide shows how to swap in persistent database storage using the RepositoryManager.

## Integration Pattern

The API uses an in-memory session store (`sessions` object). We'll replace it with database calls:

```typescript
// Before: In-memory
const sessions: { [key: string]: Session } = {};

// After: Database
const repo = getRepository();
const sessions = await repo.sessions.getAll();
```

## Step 1: Initialize Database on Server Startup

Add to `src/api/server.ts`:

```typescript
import { initializeDatabase, initializeRepository } from '../db/database';
import { getRepository } from '../db/repository';

// Before starting the server
const app = express();

// Initialize database on startup
let db: DatabaseManager;

async function startServer() {
  // Initialize database
  db = await initializeDatabase({
    type: process.env.DB_TYPE || 'sqlite',
    database: process.env.DB_NAME || 'federated_learning.db',
    filepath: process.env.DB_PATH || './data/federated_learning.db'
  });

  // Initialize repository layer
  initializeRepository(db);

  console.log('Database initialized successfully');

  // Start Express server
  app.listen(PORT, () => {
    console.log(`API running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  const database = getDatabase();
  await database.close();
  process.exit(0);
});
```

## Step 2: Update Session Creation Endpoint

Replace in-memory session storage:

```typescript
// Before
router.post('/sessions', (req, res) => {
  const sessionId = `session-${Date.now()}`;
  const session = new FederatedServer(
    sessionId,
    req.body.strategy,
    req.body.initialWeights
  );
  
  sessions[sessionId] = {
    server: session,
    clients: [],
    trainingRounds: 0,
    communicationRounds: 0,
  };

  res.json({ sessionId, ...req.body });
});

// After
router.post('/sessions', async (req, res) => {
  try {
    const repo = getRepository();
    
    const sessionId = `session-${Date.now()}`;
    const server = new FederatedServer(
      sessionId,
      req.body.strategy,
      req.body.initialWeights
    );
    
    // Save to database
    const session = await repo.sessions.create(
      sessionId,
      req.body.strategy,
      req.body.initialWeights
    );

    // Keep in-memory reference for training (will replace with proper server state storage later)
    sessions[sessionId] = {
      server,
      clients: [],
      trainingRounds: 0,
      communicationRounds: 0,
    };

    res.json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

## Step 3: Update List Sessions Endpoint

```typescript
// Before
router.get('/sessions', (req, res) => {
  const sessionsList = Object.values(sessions).map(s => ({
    sessionId: s.server.sessionId,
    strategy: s.server.strategy,
    clientCount: s.clients.length,
    trainingRounds: s.trainingRounds,
    communicationRounds: s.communicationRounds,
  }));

  res.json({
    totalSessions: sessionsList.length,
    sessions: sessionsList,
  });
});

// After
router.get('/sessions', async (req, res) => {
  try {
    const repo = getRepository();
    const allSessions = await repo.sessions.getAll();
    
    res.json({
      totalSessions: allSessions.length,
      sessions: allSessions,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

## Step 4: Update Get Session Endpoint

```typescript
// Before
router.get('/sessions/:sessionId', (req, res) => {
  const session = sessions[req.params.sessionId];
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  res.json({
    sessionId: session.server.sessionId,
    strategy: session.server.strategy,
    clientCount: session.clients.length,
    trainingRounds: session.trainingRounds,
    communicationRounds: session.communicationRounds,
  });
});

// After
router.get('/sessions/:sessionId', async (req, res) => {
  try {
    const repo = getRepository();
    const session = await repo.sessions.getById(req.params.sessionId);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    res.json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

## Step 5: Update Add Client Endpoint

```typescript
// Before
router.post('/sessions/:sessionId/clients', (req, res) => {
  const session = sessions[req.params.sessionId];
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  const client: TrainableClient = {
    id: `client-${Date.now()}`,
    features: req.body.features,
    samples: req.body.samples,
  };

  session.server.addClient(client.id, client);
  session.clients.push(client);

  res.json({
    clientId: client.id,
    features: client.features,
    samples: client.samples,
  });
});

// After
router.post('/sessions/:sessionId/clients', async (req, res) => {
  try {
    const repo = getRepository();
    
    // Verify session exists
    const session = await repo.sessions.getById(req.params.sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Add client to database
    const client = await repo.clients.add(
      req.params.sessionId,
      `client-${Date.now()}`,
      req.body.features,
      req.body.samples
    );

    // Also add to in-memory server for training
    const inMemorySession = sessions[req.params.sessionId];
    if (inMemorySession) {
      inMemorySession.server.addClient(client.clientId, {
        id: client.clientId,
        features: req.body.features,
        samples: req.body.samples,
      });
    }

    res.json(client);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

## Step 6: Update Training Endpoint

```typescript
// Before
router.post('/sessions/:sessionId/train', async (req, res) => {
  const session = sessions[req.params.sessionId];
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  // ... training logic ...
  // After each round:
  session.trainingRounds++;
  session.communicationRounds++;
});

// After
router.post('/sessions/:sessionId/train', async (req, res) => {
  try {
    const repo = getRepository();
    const session = await repo.sessions.getById(req.params.sessionId);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const inMemorySession = sessions[req.params.sessionId];
    if (!inMemorySession) {
      return res.status(500).json({ error: 'Session server not initialized' });
    }

    // ... training logic ...

    // Record each training round
    for (let round = 1; round <= req.body.rounds; round++) {
      const loss = Math.random() * 0.5;
      const accuracy = 0.5 + Math.random() * 0.5;
      const duration = Math.floor(Math.random() * 1000 + 500);

      await repo.training.recordRound(
        req.params.sessionId,
        round,
        loss,
        accuracy,
        duration
      );

      inMemorySession.trainingRounds++;
    }

    // Save final metrics
    const metrics = await repo.metrics.save(
      req.params.sessionId,
      inMemorySession.server.getGlobalWeights(),
      inMemorySession.communicationRounds
    );

    // Update session status
    await repo.sessions.updateMetrics(
      req.params.sessionId,
      inMemorySession.clients.length,
      inMemorySession.trainingRounds,
      inMemorySession.communicationRounds
    );

    res.json({
      sessionId: req.params.sessionId,
      trainingRounds: inMemorySession.trainingRounds,
      metrics,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

## Step 7: Update Metrics Endpoint

```typescript
// Before
router.get('/sessions/:sessionId/metrics', (req, res) => {
  const session = sessions[req.params.sessionId];
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  res.json({
    trainingRounds: session.trainingRounds,
    communicationRounds: session.communicationRounds,
    weights: session.server.getGlobalWeights(),
  });
});

// After
router.get('/sessions/:sessionId/metrics', async (req, res) => {
  try {
    const repo = getRepository();
    const metrics = await repo.metrics.getLatest(req.params.sessionId);
    
    if (!metrics) {
      return res.status(404).json({ error: 'No metrics found for session' });
    }
    
    res.json(metrics);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

## Step 8: Update Delete Session Endpoint

```typescript
// Before
router.delete('/sessions/:sessionId', (req, res) => {
  if (!sessions[req.params.sessionId]) {
    return res.status(404).json({ error: 'Session not found' });
  }

  delete sessions[req.params.sessionId];
  res.json({ message: 'Session deleted' });
});

// After
router.delete('/sessions/:sessionId', async (req, res) => {
  try {
    const repo = getRepository();
    
    // Verify session exists
    const session = await repo.sessions.getById(req.params.sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Delete from database
    await repo.sessions.delete(req.params.sessionId);
    
    // Remove from in-memory
    delete sessions[req.params.sessionId];

    res.json({ message: 'Session deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

## Environment Configuration

Add these to `.env.local`:

```bash
# Database
DB_TYPE=sqlite                          # or postgresql
DB_NAME=federated_learning.db
DB_PATH=./data/federated_learning.db

# PostgreSQL (if DB_TYPE=postgresql)
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=password
DB_MAX_CONNECTIONS=20
```

## Hybrid Approach (Recommended)

For now, keep a hybrid approach:

1. **Database**: Stores persistent state (sessions, clients, training history, metrics)
2. **In-Memory**: Keeps FederatedServer objects for active training

This allows:
- ✅ Persistent storage of all data
- ✅ Fast in-memory training operations
- ✅ Recovery from crashes (reload from DB)
- ✅ Gradual migration to full database

```typescript
// On startup, load active sessions from database
async function loadActiveSessions() {
  const repo = getRepository();
  const dbSessions = await repo.sessions.getAll();
  
  for (const session of dbSessions) {
    if (session.status === 'active' || session.status === 'training') {
      const server = new FederatedServer(
        session.sessionId,
        session.strategy,
        session.initialWeights
      );
      
      // Reload clients
      const clients = await repo.clients.getBySession(session.sessionId);
      for (const client of clients) {
        server.addClient(client.clientId, {
          id: client.clientId,
          features: client.featuresCount,
          samples: client.samplesCount,
        });
      }
      
      sessions[session.sessionId] = {
        server,
        clients: clients.map(c => ({
          id: c.clientId,
          features: c.featuresCount,
          samples: c.samplesCount,
        })),
        trainingRounds: session.trainingRounds,
        communicationRounds: session.communicationRounds,
      };
    }
  }
}

// Call on startup
await loadActiveSessions();
```

## Benefits of Integration

✅ **Persistence**: Sessions survive server restarts  
✅ **Analytics**: Can query training history  
✅ **Scalability**: Multiple servers share data  
✅ **Backup**: Database backups protect data  
✅ **Auditability**: Full history of all operations  

## Testing Integration

```typescript
import { initializeDatabase, initializeRepository } from './src/db/database';

// Test with in-memory SQLite
const db = await initializeDatabase({
  type: 'sqlite',
  database: ':memory:',
  filepath: ':memory:'
});

initializeRepository(db);

// Now run your API tests
// All data persists within the test but is lost after
```

## Migration Checklist

- [ ] Add database initialization to server startup
- [ ] Update all session endpoints to use repository
- [ ] Update all client endpoints to use repository
- [ ] Update training endpoints to record to database
- [ ] Add environment variables to `.env.local`
- [ ] Test each endpoint with database
- [ ] Verify data persists across restarts
- [ ] Test with both SQLite and PostgreSQL
- [ ] Update API documentation

## Troubleshooting

### Database Connection Failed
```typescript
// Check connection
const db = getDatabase();
console.log('Connected:', db.isConnected());
```

### TypeScript Errors
Ensure types are imported:
```typescript
import { 
  DatabaseManager, 
  getDatabase, 
  initializeDatabase 
} from '../db/database';
import { 
  getRepository, 
  initializeRepository 
} from '../db/repository';
```

### Duplicate Data
Use transactions for multi-step operations:
```typescript
// Record training round and update session atomically
await Promise.all([
  repo.training.recordRound(...),
  repo.sessions.updateMetrics(...)
]);
```

---

**Status:** Ready for implementation  
**Estimated Integration Time:** 2-3 hours  
**Files to Modify:** 1 (src/api/server.ts or your API file)

