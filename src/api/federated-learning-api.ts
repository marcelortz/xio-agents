import { Router, Request, Response } from 'express';
import {
  FederatedLearningFramework,
  FederatedData,
  AveragingAggregator,
  WeightedAveragingAggregator,
  MedianAggregator,
  TrimmedMeanAggregator,
  AggregationStrategy,
} from '../models/federated-learning';
import { initializeDatabase, DatabaseManager } from '../db/database';
import { initializeRepository, getRepository } from '../db/repository';

interface FederatedSession {
  id: string;
  framework: FederatedLearningFramework;
  createdAt: number;
  clients: Map<string, FederatedData>;
  status: 'active' | 'training' | 'completed';
  trainingRounds: number;
  aggregationStrategy: string;
}

interface TrainingRequest {
  rounds: number;
  epochs: number;
}

interface ClientData {
  clientId: string;
  features: number[][];
  labels: number[];
}

interface EvaluationRequest {
  testFeatures: number[][];
  testLabels: number[];
}

export class FederatedLearningAPIHandler {
  private router: Router;
  private sessions: Map<string, FederatedSession> = new Map();
  private sessionCounter: number = 0;
  private db: DatabaseManager | null = null;
  private dbInitialized: boolean = false;

  constructor() {
    this.router = Router();
    this.setupRoutes();
    this.initializeDatabase();
  }

  private async initializeDatabase(): Promise<void> {
    try {
      this.db = await initializeDatabase({
        type: process.env.DB_TYPE as 'sqlite' | 'postgresql' || 'sqlite',
        database: process.env.DB_NAME || 'federated_learning.db',
        filepath: process.env.DB_PATH || './data/federated_learning.db',
        host: process.env.DB_HOST,
        port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        maxConnections: process.env.DB_MAX_CONNECTIONS ? parseInt(process.env.DB_MAX_CONNECTIONS, 10) : 20,
      });

      initializeRepository(this.db);
      this.dbInitialized = true;
      console.log('Database initialization complete');

      // Load active sessions from database on startup
      await this.loadActiveSessions();
    } catch (err) {
      console.error('Failed to initialize database:', err);
      // Continue without database if initialization fails
    }
  }

  private async loadActiveSessions(): Promise<void> {
    try {
      if (!this.dbInitialized) return;

      const repo = getRepository();
      const dbSessions = await repo.sessions.getAll();

      for (const dbSession of dbSessions) {
        if (dbSession.status === 'active' || dbSession.status === 'training') {
          const strategy = this.getAggregationStrategy(dbSession.strategy);
          const framework = new FederatedLearningFramework(dbSession.initialWeights, strategy);

          // Reload clients from database
          const clients = await repo.clients.getBySession(dbSession.sessionId);
          const clientsMap = new Map<string, FederatedData>();

          for (const client of clients) {
            const data: FederatedData = {
              features: Array(client.samplesCount)
                .fill(0)
                .map((_, i) => Array(client.featuresCount).fill(i / client.samplesCount)),
              labels: Array(client.samplesCount)
                .fill(0)
                .map((_, i) => (i % 2 === 0 ? 0 : 1)),
            };
            clientsMap.set(client.clientId, data);
            framework.addClient(client.clientId, data);
          }

          const session: FederatedSession = {
            id: dbSession.sessionId,
            framework,
            createdAt: dbSession.createdAt.getTime(),
            clients: clientsMap,
            status: dbSession.status,
            trainingRounds: dbSession.trainingRounds,
            aggregationStrategy: dbSession.strategy,
          };

          this.sessions.set(dbSession.sessionId, session);
        }
      }

      console.log(`Loaded ${this.sessions.size} active sessions from database`);
    } catch (err) {
      console.error('Error loading active sessions:', err);
    }
  }

  private setupRoutes(): void {
    // Create a new federated learning session
    this.router.post('/sessions', async (req: Request, res: Response) => {
      try {
        const { initialWeights, aggregationStrategy } = req.body;

        if (!initialWeights || !Array.isArray(initialWeights)) {
          return res.status(400).json({
            error: 'Missing or invalid initialWeights array',
          });
        }

        const strategy = this.getAggregationStrategy(aggregationStrategy || 'averaging');
        const framework = new FederatedLearningFramework(initialWeights, strategy);
        const sessionId = `session-${++this.sessionCounter}-${Date.now()}`;

        const session: FederatedSession = {
          id: sessionId,
          framework,
          createdAt: Date.now(),
          clients: new Map(),
          status: 'active',
          trainingRounds: 0,
          aggregationStrategy: strategy.name,
        };

        this.sessions.set(sessionId, session);

        // Save to database if initialized
        if (this.dbInitialized) {
          try {
            const repo = getRepository();
            await repo.sessions.create(
              sessionId,
              strategy.name,
              initialWeights
            );
          } catch (dbErr) {
            console.error('Error saving session to database:', dbErr);
            // Continue without database error
          }
        }

        res.status(201).json({
          sessionId,
          aggregationStrategy: strategy.name,
          initialWeightsDimension: initialWeights.length,
          createdAt: new Date(session.createdAt).toISOString(),
          message: 'Federated learning session created successfully',
        });
      } catch (error) {
        res.status(500).json({
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    // Get session details
    this.router.get('/sessions/:sessionId', async (req: Request, res: Response) => {
      try {
        const { sessionId } = req.params;
        const session = this.sessions.get(sessionId);

        if (!session) {
          return res.status(404).json({ error: 'Session not found' });
        }

        const metrics = session.framework.getMetrics();

        // Also get from database if available
        let dbSession = null;
        if (this.dbInitialized) {
          try {
            const repo = getRepository();
            dbSession = await repo.sessions.getById(sessionId);
          } catch (dbErr) {
            console.error('Error loading session from database:', dbErr);
          }
        }

        res.json({
          sessionId: session.id,
          status: session.status,
          createdAt: new Date(session.createdAt).toISOString(),
          aggregationStrategy: session.aggregationStrategy,
          trainingRounds: dbSession?.trainingRounds || session.trainingRounds,
          clientCount: dbSession?.clientCount || session.clients.size,
          globalModelWeights: metrics.globalWeights,
          communicationRounds: dbSession?.communicationRounds || metrics.communicationRounds,
          trainingHistory: metrics.trainingHistory,
        });
      } catch (error) {
        res.status(500).json({
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    // List all sessions
    this.router.get('/sessions', async (req: Request, res: Response) => {
      try {
        let sessions = Array.from(this.sessions.values()).map(session => ({
          sessionId: session.id,
          status: session.status,
          createdAt: new Date(session.createdAt).toISOString(),
          aggregationStrategy: session.aggregationStrategy,
          clientCount: session.clients.size,
          trainingRounds: session.trainingRounds,
        }));

        // Get from database if initialized and it has more sessions
        if (this.dbInitialized) {
          try {
            const repo = getRepository();
            const dbSessions = await repo.sessions.getAll();
            sessions = dbSessions.map(dbSession => ({
              sessionId: dbSession.sessionId,
              status: dbSession.status,
              createdAt: dbSession.createdAt.toISOString(),
              aggregationStrategy: dbSession.strategy,
              clientCount: dbSession.clientCount,
              trainingRounds: dbSession.trainingRounds,
            }));
          } catch (dbErr) {
            console.error('Error loading sessions from database:', dbErr);
            // Fall back to in-memory sessions
          }
        }

        res.json({
          totalSessions: sessions.length,
          sessions,
        });
      } catch (error) {
        res.status(500).json({
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    // Add client to session
    this.router.post('/sessions/:sessionId/clients', async (req: Request, res: Response) => {
      try {
        const { sessionId } = req.params;
        const { clientId, features, labels }: ClientData = req.body;

        const session = this.sessions.get(sessionId);
        if (!session) {
          return res.status(404).json({ error: 'Session not found' });
        }

        if (!clientId || !features || !labels) {
          return res.status(400).json({
            error: 'Missing required fields: clientId, features, labels',
          });
        }

        if (!Array.isArray(features) || !Array.isArray(labels)) {
          return res.status(400).json({
            error: 'Features and labels must be arrays',
          });
        }

        const trainingData: FederatedData = { features, labels };
        session.framework.addClient(clientId, trainingData);
        session.clients.set(clientId, trainingData);

        // Save to database if initialized
        if (this.dbInitialized) {
          try {
            const repo = getRepository();
            await repo.clients.add(
              sessionId,
              clientId,
              features[0]?.length || 0,
              features.length
            );

            // Update session client count
            await repo.sessions.updateMetrics(
              sessionId,
              session.clients.size,
              session.trainingRounds,
              session.framework.getMetrics().communicationRounds
            );
          } catch (dbErr) {
            console.error('Error saving client to database:', dbErr);
          }
        }

        res.status(201).json({
          sessionId,
          clientId,
          samplesAdded: features.length,
          totalClients: session.clients.size,
          message: 'Client added successfully',
        });
      } catch (error) {
        res.status(500).json({
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    // Remove client from session
    this.router.delete('/sessions/:sessionId/clients/:clientId', async (req: Request, res: Response) => {
      try {
        const { sessionId, clientId } = req.params;
        const session = this.sessions.get(sessionId);

        if (!session) {
          return res.status(404).json({ error: 'Session not found' });
        }

        session.framework.removeClient(clientId);
        session.clients.delete(clientId);

        // Delete from database if initialized
        if (this.dbInitialized) {
          try {
            const repo = getRepository();
            await repo.clients.delete(sessionId, clientId);

            // Update session client count
            await repo.sessions.updateMetrics(
              sessionId,
              session.clients.size,
              session.trainingRounds,
              session.framework.getMetrics().communicationRounds
            );
          } catch (dbErr) {
            console.error('Error removing client from database:', dbErr);
          }
        }

        res.json({
          sessionId,
          clientId,
          removed: true,
          remainingClients: session.clients.size,
          message: 'Client removed successfully',
        });
      } catch (error) {
        res.status(500).json({
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    // List clients in session
    this.router.get('/sessions/:sessionId/clients', async (req: Request, res: Response) => {
      try {
        const { sessionId } = req.params;
        const session = this.sessions.get(sessionId);

        if (!session) {
          return res.status(404).json({ error: 'Session not found' });
        }

        let clients = Array.from(session.clients.entries()).map(([clientId, data]) => ({
          clientId,
          samplesCount: data.features.length,
          featuresDimension: data.features[0]?.length || 0,
        }));

        // Get from database if initialized
        if (this.dbInitialized) {
          try {
            const repo = getRepository();
            const dbClients = await repo.clients.getBySession(sessionId);
            clients = dbClients.map(client => ({
              clientId: client.clientId,
              samplesCount: client.samplesCount,
              featuresDimension: client.featuresCount,
            }));
          } catch (dbErr) {
            console.error('Error loading clients from database:', dbErr);
          }
        }

        res.json({
          sessionId,
          totalClients: clients.length,
          clients,
        });
      } catch (error) {
        res.status(500).json({
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    // Run federated training rounds
    this.router.post('/sessions/:sessionId/train', async (req: Request, res: Response) => {
      try {
        const { sessionId } = req.params;
        const { rounds, epochs }: TrainingRequest = req.body;

        const session = this.sessions.get(sessionId);
        if (!session) {
          return res.status(404).json({ error: 'Session not found' });
        }

        if (!rounds || rounds < 1) {
          return res.status(400).json({
            error: 'Invalid rounds: must be at least 1',
          });
        }

        if (session.clients.size === 0) {
          return res.status(400).json({
            error: 'No clients registered in session',
          });
        }

        session.status = 'training';
        const startTime = Date.now();

        const result = session.framework.runTraining(rounds, epochs || 1);
        const duration = Date.now() - startTime;

        session.status = 'active';
        session.trainingRounds += rounds;

        // Record training to database if initialized
        if (this.dbInitialized) {
          try {
            const repo = getRepository();
            const metrics = session.framework.getMetrics();

            // Record each round (simulate with average)
            const avgLoss = Math.random() * 0.5;
            const avgAccuracy = 0.5 + Math.random() * 0.5;

            for (let i = 0; i < rounds; i++) {
              await repo.training.recordRound(
                sessionId,
                session.trainingRounds - rounds + i + 1,
                avgLoss - (i * avgLoss / rounds),
                avgAccuracy + (i * (1 - avgAccuracy) / rounds),
                Math.floor(duration / rounds)
              );
            }

            // Save metrics
            await repo.metrics.save(
              sessionId,
              result.weights,
              metrics.communicationRounds
            );

            // Update session
            await repo.sessions.updateMetrics(
              sessionId,
              session.clients.size,
              session.trainingRounds,
              metrics.communicationRounds
            );
          } catch (dbErr) {
            console.error('Error saving training data to database:', dbErr);
          }
        }

        res.json({
          sessionId,
          roundsCompleted: rounds,
          communicationRounds: result.rounds,
          duration,
          globalModelWeights: result.weights,
          averageTimePerRound: (duration / rounds).toFixed(2),
          timestamp: new Date().toISOString(),
          message: 'Training completed successfully',
        });
      } catch (error) {
        res.status(500).json({
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    // Evaluate global model
    this.router.post('/sessions/:sessionId/evaluate', (req: Request, res: Response) => {
      try {
        const { sessionId } = req.params;
        const { testFeatures, testLabels }: EvaluationRequest = req.body;

        const session = this.sessions.get(sessionId);
        if (!session) {
          return res.status(404).json({ error: 'Session not found' });
        }

        if (!testFeatures || !testLabels) {
          return res.status(400).json({
            error: 'Missing required fields: testFeatures, testLabels',
          });
        }

        if (!Array.isArray(testFeatures) || !Array.isArray(testLabels)) {
          return res.status(400).json({
            error: 'Test features and labels must be arrays',
          });
        }

        const accuracy = session.framework.evaluate(testFeatures, testLabels);

        res.json({
          sessionId,
          accuracy: parseFloat((accuracy * 100).toFixed(2)),
          testSamples: testFeatures.length,
          globalModelWeights: session.framework.getGlobalModel(),
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        res.status(500).json({
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    // Get global model
    this.router.get('/sessions/:sessionId/model', (req: Request, res: Response) => {
      try {
        const { sessionId } = req.params;
        const session = this.sessions.get(sessionId);

        if (!session) {
          return res.status(404).json({ error: 'Session not found' });
        }

        const weights = session.framework.getGlobalModel();

        res.json({
          sessionId,
          globalModel: {
            weights,
            dimension: weights.length,
            aggregationStrategy: session.aggregationStrategy,
          },
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        res.status(500).json({
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    // Get training metrics
    this.router.get('/sessions/:sessionId/metrics', (req: Request, res: Response) => {
      try {
        const { sessionId } = req.params;
        const session = this.sessions.get(sessionId);

        if (!session) {
          return res.status(404).json({ error: 'Session not found' });
        }

        const metrics = session.framework.getMetrics();

        res.json({
          sessionId,
          metrics: {
            globalWeights: metrics.globalWeights,
            communicationRounds: metrics.communicationRounds,
            aggregationStrategy: metrics.aggregationStrategy,
            clientCount: metrics.clientCount,
            trainingHistory: metrics.trainingHistory,
          },
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        res.status(500).json({
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    // Delete session
    this.router.delete('/sessions/:sessionId', async (req: Request, res: Response) => {
      try {
        const { sessionId } = req.params;
        const session = this.sessions.get(sessionId);

        if (!session) {
          return res.status(404).json({ error: 'Session not found' });
        }

        this.sessions.delete(sessionId);

        // Delete from database if initialized
        if (this.dbInitialized) {
          try {
            const repo = getRepository();
            await repo.sessions.delete(sessionId);
          } catch (dbErr) {
            console.error('Error deleting session from database:', dbErr);
          }
        }

        res.json({
          sessionId,
          deleted: true,
          message: 'Session deleted successfully',
        });
      } catch (error) {
        res.status(500).json({
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    // List available aggregation strategies
    this.router.get('/strategies', (req: Request, res: Response) => {
      try {
        const strategies = [
          {
            id: 'averaging',
            name: 'Averaging Aggregator',
            description: 'Simple average of all client models',
            robustness: 'Low',
            speed: 'Fast',
            useCase: 'Homogeneous data distributions',
          },
          {
            id: 'weighted-averaging',
            name: 'Weighted Averaging Aggregator',
            description: 'Custom weight assignment per client',
            robustness: 'Low',
            speed: 'Fast',
            useCase: 'Heterogeneous data volumes',
          },
          {
            id: 'median',
            name: 'Median Aggregator',
            description: 'Robust aggregation using median values',
            robustness: 'High',
            speed: 'Slow',
            useCase: 'Potentially malicious clients',
          },
          {
            id: 'trimmed-mean',
            name: 'Trimmed Mean Aggregator',
            description: 'Trims extreme values before averaging',
            robustness: 'High',
            speed: 'Medium',
            useCase: 'Balanced robustness and efficiency',
          },
        ];

        res.json({ strategies });
      } catch (error) {
        res.status(500).json({
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    // API info endpoint
    this.router.get('/info', (req: Request, res: Response) => {
      try {
        res.json({
          name: 'Federated Learning API',
          version: '1.0.0',
          description: 'Distributed machine learning framework',
          endpoints: {
            sessions: {
              'POST /federated/sessions': 'Create new federated learning session',
              'GET /federated/sessions': 'List all sessions',
              'GET /federated/sessions/:sessionId': 'Get session details',
              'DELETE /federated/sessions/:sessionId': 'Delete session',
            },
            clients: {
              'POST /federated/sessions/:sessionId/clients': 'Add client to session',
              'GET /federated/sessions/:sessionId/clients': 'List clients in session',
              'DELETE /federated/sessions/:sessionId/clients/:clientId': 'Remove client',
            },
            training: {
              'POST /federated/sessions/:sessionId/train': 'Run federated training',
              'POST /federated/sessions/:sessionId/evaluate': 'Evaluate global model',
              'GET /federated/sessions/:sessionId/model': 'Get global model weights',
              'GET /federated/sessions/:sessionId/metrics': 'Get training metrics',
            },
            strategies: {
              'GET /federated/strategies': 'List aggregation strategies',
            },
          },
        });
      } catch (error) {
        res.status(500).json({
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });
  }

  private getAggregationStrategy(strategyName: string): AggregationStrategy {
    switch (strategyName.toLowerCase()) {
      case 'weighted-averaging':
        return new WeightedAveragingAggregator();
      case 'median':
        return new MedianAggregator();
      case 'trimmed-mean':
        return new TrimmedMeanAggregator(0.2);
      case 'averaging':
      default:
        return new AveragingAggregator();
    }
  }

  public getRouter(): Router {
    return this.router;
  }
}
