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

  constructor() {
    this.router = Router();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // Create a new federated learning session
    this.router.post('/sessions', (req: Request, res: Response) => {
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
    this.router.get('/sessions/:sessionId', (req: Request, res: Response) => {
      try {
        const { sessionId } = req.params;
        const session = this.sessions.get(sessionId);

        if (!session) {
          return res.status(404).json({ error: 'Session not found' });
        }

        const metrics = session.framework.getMetrics();

        res.json({
          sessionId: session.id,
          status: session.status,
          createdAt: new Date(session.createdAt).toISOString(),
          aggregationStrategy: session.aggregationStrategy,
          trainingRounds: session.trainingRounds,
          clientCount: session.clients.size,
          globalModelWeights: metrics.globalWeights,
          communicationRounds: metrics.communicationRounds,
          trainingHistory: metrics.trainingHistory,
        });
      } catch (error) {
        res.status(500).json({
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    // List all sessions
    this.router.get('/sessions', (req: Request, res: Response) => {
      try {
        const sessions = Array.from(this.sessions.values()).map(session => ({
          sessionId: session.id,
          status: session.status,
          createdAt: new Date(session.createdAt).toISOString(),
          aggregationStrategy: session.aggregationStrategy,
          clientCount: session.clients.size,
          trainingRounds: session.trainingRounds,
        }));

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
    this.router.post('/sessions/:sessionId/clients', (req: Request, res: Response) => {
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
    this.router.delete('/sessions/:sessionId/clients/:clientId', (req: Request, res: Response) => {
      try {
        const { sessionId, clientId } = req.params;
        const session = this.sessions.get(sessionId);

        if (!session) {
          return res.status(404).json({ error: 'Session not found' });
        }

        session.framework.removeClient(clientId);
        session.clients.delete(clientId);

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
    this.router.get('/sessions/:sessionId/clients', (req: Request, res: Response) => {
      try {
        const { sessionId } = req.params;
        const session = this.sessions.get(sessionId);

        if (!session) {
          return res.status(404).json({ error: 'Session not found' });
        }

        const clients = Array.from(session.clients.entries()).map(([clientId, data]) => ({
          clientId,
          samplesCount: data.features.length,
          featuresDimension: data.features[0]?.length || 0,
        }));

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
    this.router.post('/sessions/:sessionId/train', (req: Request, res: Response) => {
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
    this.router.delete('/sessions/:sessionId', (req: Request, res: Response) => {
      try {
        const { sessionId } = req.params;
        const session = this.sessions.get(sessionId);

        if (!session) {
          return res.status(404).json({ error: 'Session not found' });
        }

        this.sessions.delete(sessionId);

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
