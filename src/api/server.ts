import express, { Express, Request, Response } from 'express';
import { GeneticAlgorithm, ParticleSwarmOptimizer } from '../models/genetic-optimizer';
import {
  SimulatedAnnealing,
  AntColonyOptimization,
  DifferentialEvolution,
  HarmonySearch,
  TabuSearch,
} from '../models/advanced-optimizers';
import { Optimizer } from '../models/optimizer';
import { FederatedLearningAPIHandler } from './federated-learning-api';
import { getDatabase } from '../db/database';

interface OptimizationRequest {
  algorithm: string;
  dimension: number;
  maxIterations?: number;
  objective?: string;
  parameters?: Record<string, number>;
}

interface OptimizationResponse {
  algorithm: string;
  solution: number[];
  fitness: number;
  duration: number;
  timestamp: string;
}

export class MLOptimizationAPI {
  private app: Express;
  private port: number;

  constructor(port: number = 3000) {
    this.app = express();
    this.port = port;
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ limit: '10mb', extended: true }));

    // Serve static files (dashboard) - only if public directory exists
    try {
      this.app.use(express.static('public'));
    } catch (err) {
      console.warn('Public directory not found, skipping static files');
    }

    // CORS middleware
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
      } else {
        next();
      }
    });

    // Logging middleware
    this.app.use((req, res, next) => {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
      next();
    });
  }

  private setupRoutes(): void {
    // Initialize federated learning API
    const federatedAPI = new FederatedLearningAPIHandler();
    this.app.use('/federated', federatedAPI.getRouter());

    // Health check
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({ status: 'healthy', timestamp: new Date().toISOString() });
    });

    // Info endpoint
    this.app.get('/api/info', (req: Request, res: Response) => {
      res.json({
        name: 'ML Optimization Suite API',
        version: '1.0.0',
        phase: '4 - REST API',
        algorithms: [
          'genetic-algorithm',
          'particle-swarm',
          'simulated-annealing',
          'ant-colony',
          'differential-evolution',
          'harmony-search',
          'tabu-search',
        ],
        totalAlgorithms: 11,
      });
    });

    // List all algorithms
    this.app.get('/api/algorithms', (req: Request, res: Response) => {
      const algorithms = [
        {
          id: 'genetic-algorithm',
          name: 'Genetic Algorithm',
          type: 'Population-based',
          complexity: 'High',
          description: 'Evolution-inspired optimization with selection, crossover, and mutation',
        },
        {
          id: 'particle-swarm',
          name: 'Particle Swarm Optimizer',
          type: 'Swarm-based',
          complexity: 'Medium',
          description: 'Swarm intelligence with velocity and position updates',
        },
        {
          id: 'simulated-annealing',
          name: 'Simulated Annealing',
          type: 'Temperature-based',
          complexity: 'Medium',
          description: 'Probabilistic acceptance with cooling schedule',
        },
        {
          id: 'ant-colony',
          name: 'Ant Colony Optimization',
          type: 'Swarm-based',
          complexity: 'High',
          description: 'Pheromone-based exploration and exploitation',
        },
        {
          id: 'differential-evolution',
          name: 'Differential Evolution',
          type: 'Population-based',
          complexity: 'Medium',
          description: 'Mutation and crossover with self-adaptation',
        },
        {
          id: 'harmony-search',
          name: 'Harmony Search',
          type: 'Music-inspired',
          complexity: 'Low',
          description: 'Musicians finding harmony in parameter space',
        },
        {
          id: 'tabu-search',
          name: 'Tabu Search',
          type: 'Memory-based',
          complexity: 'Medium',
          description: 'Neighborhood search with memory-based cycling prevention',
        },
      ];

      res.json(algorithms);
    });

    // Optimize endpoint
    this.app.post('/api/optimize', async (req: Request, res: Response) => {
      try {
        const request: OptimizationRequest = req.body;

        if (!request.algorithm || !request.dimension) {
          return res.status(400).json({
            error: 'Missing required fields: algorithm, dimension',
          });
        }

        const startTime = Date.now();
        const solution = this.runOptimization(request);
        const duration = Date.now() - startTime;

        // Calculate fitness
        const fitness = this.calculateFitness(solution, request.objective);

        const response: OptimizationResponse = {
          algorithm: request.algorithm,
          solution,
          fitness,
          duration,
          timestamp: new Date().toISOString(),
        };

        res.json(response);
      } catch (error) {
        res.status(500).json({
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    // Batch optimize endpoint
    this.app.post('/api/batch-optimize', async (req: Request, res: Response) => {
      try {
        const { algorithms, dimension, maxIterations } = req.body;

        if (!algorithms || !Array.isArray(algorithms)) {
          return res.status(400).json({
            error: 'Missing or invalid algorithms array',
          });
        }

        const results = algorithms.map((algo: string) => {
          const startTime = Date.now();
          const solution = this.runOptimization({
            algorithm: algo,
            dimension,
            maxIterations,
          });
          const duration = Date.now() - startTime;
          const fitness = this.calculateFitness(solution);

          return {
            algorithm: algo,
            solution,
            fitness,
            duration,
          };
        });

        res.json({
          results,
          totalTime: results.reduce((sum: number, r: any) => sum + r.duration, 0),
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        res.status(500).json({
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    // Compare algorithms endpoint
    this.app.post('/api/compare', async (req: Request, res: Response) => {
      try {
        const { algorithms, dimension, iterations } = req.body;

        if (!algorithms || !Array.isArray(algorithms)) {
          return res.status(400).json({
            error: 'Missing or invalid algorithms array',
          });
        }

        const comparison = algorithms.map((algo: string) => {
          const startTime = Date.now();
          const solution = this.runOptimization({
            algorithm: algo,
            dimension,
            maxIterations: iterations || 100,
          });
          const duration = Date.now() - startTime;
          const fitness = this.calculateFitness(solution);

          return {
            algorithm: algo,
            fitness,
            duration,
            quality: fitness / dimension, // Normalized fitness
          };
        });

        // Sort by fitness (descending)
        comparison.sort((a: any, b: any) => b.fitness - a.fitness);

        res.json({
          comparison,
          best: comparison[0],
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        res.status(500).json({
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    // 404 handler
    this.app.use((req: Request, res: Response) => {
      res.status(404).json({
        error: 'Endpoint not found',
        path: req.path,
      });
    });
  }

  private runOptimization(request: OptimizationRequest): number[] {
    const fitnessFunction = (solution: number[]) => {
      return solution.reduce((sum, val) => sum + val, 0);
    };

    switch (request.algorithm) {
      case 'genetic-algorithm':
        const ga = new GeneticAlgorithm(
          request.parameters?.populationSize || 50,
          request.parameters?.mutationRate || 0.1,
          request.parameters?.crossoverRate || 0.8,
          request.maxIterations || 100
        );
        return ga.optimize(request.dimension, fitnessFunction);

      case 'particle-swarm':
        const pso = new ParticleSwarmOptimizer(
          request.parameters?.numParticles || 30,
          request.maxIterations || 100
        );
        return pso.optimize(request.dimension, fitnessFunction);

      case 'simulated-annealing':
        const sa = new SimulatedAnnealing(
          request.parameters?.temperature || 100,
          request.parameters?.coolingRate || 0.95,
          request.parameters?.minTemp || 0.01
        );
        return sa.optimize(request.dimension, fitnessFunction);

      case 'ant-colony':
        const aco = new AntColonyOptimization(
          request.parameters?.numAnts || 30,
          request.maxIterations || 100,
          request.parameters?.evaporationRate || 0.1
        );
        return aco.optimize(request.dimension, fitnessFunction);

      case 'differential-evolution':
        const de = new DifferentialEvolution(
          request.parameters?.populationSize || 50,
          request.maxIterations || 100,
          request.parameters?.scaleF || 0.8,
          request.parameters?.crossoverRate || 0.9
        );
        return de.optimize(request.dimension, fitnessFunction);

      case 'harmony-search':
        const hs = new HarmonySearch(
          request.parameters?.harmonyMemorySize || 30,
          request.maxIterations || 100,
          request.parameters?.hmcr || 0.9,
          request.parameters?.par || 0.3
        );
        return hs.optimize(request.dimension, fitnessFunction);

      case 'tabu-search':
        const ts = new TabuSearch(
          request.maxIterations || 100,
          request.parameters?.tabuTenure || 10,
          request.parameters?.neighborhoodSize || 20
        );
        return ts.optimize(request.dimension, fitnessFunction);

      default:
        throw new Error(`Unknown algorithm: ${request.algorithm}`);
    }
  }

  private calculateFitness(solution: number[], objective?: string): number {
    if (objective === 'maximize') {
      return solution.reduce((sum, val) => sum + val, 0);
    } else if (objective === 'minimize') {
      return -solution.reduce((sum, val) => sum + Math.pow(val - 0.5, 2), 0);
    }
    return solution.reduce((sum, val) => sum + val, 0);
  }

  public start(): void {
    const server = this.app.listen(this.port, () => {
      console.log(`ML Optimization Suite API running on http://localhost:${this.port}`);
      console.log(`Health check: http://localhost:${this.port}/health`);
      console.log(`API docs: http://localhost:${this.port}/api/info`);
    });

    // Handle graceful shutdown
    const gracefulShutdown = async () => {
      console.log('Shutting down gracefully...');
      server.close(async () => {
        try {
          const db = getDatabase();
          if (db) {
            await db.close();
            console.log('Database connection closed');
          }
        } catch (err) {
          console.error('Error closing database:', err);
        }
        process.exit(0);
      });
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
  }

  public getApp(): Express {
    return this.app;
  }
}

// Start server if running directly
if (require.main === module) {
  const port = parseInt(process.env.PORT || '3000', 10);
  console.log(`Starting server on port ${port}...`);

  try {
    const api = new MLOptimizationAPI(port);
    api.start();
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }

  // Handle uncaught exceptions
  process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Rejection:', reason);
    process.exit(1);
  });
}
