import { Express, Request, Response } from 'express';
import { GeneticAlgorithm, ParticleSwarmOptimizer } from '../models/genetic-optimizer';
import {
  SimulatedAnnealing,
  AntColonyOptimization,
  DifferentialEvolution,
  HarmonySearch,
  TabuSearch,
} from '../models/advanced-optimizers';

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
  success: boolean;
}

export class OptimizationEndpoints {
  static registerEndpoints(app: Express): void {
    // List available algorithms
    app.get('/api/algorithms', (req: Request, res: Response) => {
      res.json({
        algorithms: [
          {
            name: 'genetic',
            description: 'Genetic Algorithm - Evolution-based optimization',
            params: ['populationSize', 'mutationRate', 'crossoverRate', 'maxGenerations'],
          },
          {
            name: 'pso',
            description: 'Particle Swarm Optimization - Swarm intelligence',
            params: ['numParticles', 'maxIterations', 'inertiaWeight', 'cognitiveFactor', 'socialFactor'],
          },
          {
            name: 'simulated-annealing',
            description: 'Simulated Annealing - Probabilistic approach',
            params: ['initialTemp', 'coolingRate', 'maxIterations'],
          },
          {
            name: 'ant-colony',
            description: 'Ant Colony Optimization - Pheromone-based',
            params: ['numAnts', 'evaporationRate', 'maxIterations'],
          },
          {
            name: 'differential-evolution',
            description: 'Differential Evolution - Population-based stochastic',
            params: ['populationSize', 'F', 'CR', 'maxIterations'],
          },
          {
            name: 'harmony-search',
            description: 'Harmony Search - Music-inspired',
            params: ['harmonyMemorySize', 'harmonicMemoryConsiderationRate', 'maxIterations'],
          },
          {
            name: 'tabu-search',
            description: 'Tabu Search - Memory-based local search',
            params: ['tabuListSize', 'maxIterations'],
          },
        ],
        timestamp: new Date().toISOString(),
      });
    });

    // Run optimization
    app.post('/api/optimize', (req: Request, res: Response) => {
      try {
        const request = req.body as OptimizationRequest;

        // Validate request
        if (!request.algorithm || !request.dimension) {
          return res.status(400).json({
            success: false,
            error: 'Missing required fields: algorithm, dimension',
          });
        }

        const startTime = Date.now();
        let solution: number[] = [];
        let fitness: number = 0;
        let algorithm = request.algorithm.toLowerCase();

        // Default objective function (sphere function)
        const objectiveFunction = (x: number[]) =>
          -x.reduce((sum, val) => sum + (val - 0.5) ** 2, 0);

        // Run selected algorithm
        switch (algorithm) {
          case 'genetic': {
            const ga = new GeneticAlgorithm(
              request.parameters?.populationSize || 50,
              request.parameters?.mutationRate || 0.1,
              request.parameters?.crossoverRate || 0.8,
              request.parameters?.maxIterations || 100
            );
            solution = ga.optimize(request.dimension, objectiveFunction);
            fitness = objectiveFunction(solution);
            break;
          }

          case 'pso': {
            const pso = new ParticleSwarmOptimizer(
              request.parameters?.numParticles || 30,
              request.parameters?.maxIterations || 100
            );
            const result = pso.optimize(request.dimension, objectiveFunction);
            solution = result;
            fitness = objectiveFunction(result);
            break;
          }

          case 'simulated-annealing': {
            const sa = new SimulatedAnnealing(
              request.parameters?.initialTemp || 100,
              request.parameters?.coolingRate || 0.95,
              request.parameters?.maxIterations || 1000
            );
            const objectiveFunction = (x: number[]) =>
              -x.reduce((sum, val) => sum + (val - 0.5) ** 2, 0);
            const result = sa.optimize(request.dimension, objectiveFunction);
            solution = result;
            fitness = objectiveFunction(result);
            break;
          }

          case 'ant-colony': {
            const aco = new AntColonyOptimization(
              request.parameters?.numAnts || 30,
              request.parameters?.evaporationRate || 0.1,
              request.parameters?.maxIterations || 100
            );
            const objectiveFunction = (x: number[]) =>
              -x.reduce((sum, val) => sum + (val - 0.5) ** 2, 0);
            const result = aco.optimize(request.dimension, objectiveFunction);
            solution = result;
            fitness = objectiveFunction(result);
            break;
          }

          case 'differential-evolution': {
            const de = new DifferentialEvolution(
              request.parameters?.populationSize || 50,
              request.parameters?.F || 0.8,
              request.parameters?.CR || 0.9,
              request.parameters?.maxIterations || 100
            );
            const objectiveFunction = (x: number[]) =>
              -x.reduce((sum, val) => sum + (val - 0.5) ** 2, 0);
            const result = de.optimize(request.dimension, objectiveFunction);
            solution = result;
            fitness = objectiveFunction(result);
            break;
          }

          case 'harmony-search': {
            const hs = new HarmonySearch(
              request.parameters?.harmonyMemorySize || 20,
              request.parameters?.harmonicMemoryConsiderationRate || 0.9,
              request.parameters?.maxIterations || 100
            );
            const objectiveFunction = (x: number[]) =>
              -x.reduce((sum, val) => sum + (val - 0.5) ** 2, 0);
            const result = hs.optimize(request.dimension, objectiveFunction);
            solution = result;
            fitness = objectiveFunction(result);
            break;
          }

          case 'tabu-search': {
            const ts = new TabuSearch(
              request.parameters?.tabuListSize || 50,
              request.parameters?.maxIterations || 1000
            );
            const objectiveFunction = (x: number[]) =>
              -x.reduce((sum, val) => sum + (val - 0.5) ** 2, 0);
            const result = ts.optimize(request.dimension, objectiveFunction);
            solution = result;
            fitness = objectiveFunction(result);
            break;
          }

          default:
            return res.status(400).json({
              success: false,
              error: `Unknown algorithm: ${algorithm}`,
            });
        }

        const duration = Date.now() - startTime;

        const response: OptimizationResponse = {
          algorithm: request.algorithm,
          solution: solution.slice(0, 20), // Return first 20 values
          fitness: fitness,
          duration: duration,
          timestamp: new Date().toISOString(),
          success: true,
        };

        res.json(response);
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    // Batch optimization
    app.post('/api/optimize/batch', (req: Request, res: Response) => {
      try {
        const { requests } = req.body as { requests: OptimizationRequest[] };

        if (!Array.isArray(requests) || requests.length === 0) {
          return res.status(400).json({
            success: false,
            error: 'Invalid requests array',
          });
        }

        const startTime = Date.now();
        const results: OptimizationResponse[] = [];

        for (const req of requests) {
          try {
            const objFunc = (x: number[]) => -x.reduce((sum, val) => sum + (val - 0.5) ** 2, 0);
            const ga = new GeneticAlgorithm(50, 0.1, 0.8, 100);
            const result = ga.optimize(req.dimension, objFunc);

            results.push({
              algorithm: req.algorithm,
              solution: result.slice(0, 20),
              fitness: objFunc(result),
              duration: Date.now() - startTime,
              timestamp: new Date().toISOString(),
              success: true,
            });
          } catch (err) {
            results.push({
              algorithm: req.algorithm,
              solution: [],
              fitness: 0,
              duration: 0,
              timestamp: new Date().toISOString(),
              success: false,
            });
          }
        }

        res.json({
          results,
          totalDuration: Date.now() - startTime,
          count: results.length,
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    // Algorithm comparison
    app.post('/api/optimize/compare', (req: Request, res: Response) => {
      try {
        const { dimension, iterations = 100 } = req.body;

        if (!dimension) {
          return res.status(400).json({
            success: false,
            error: 'Missing dimension parameter',
          });
        }

        const results: Record<string, any> = {};
        const startTime = Date.now();

        const objFunc = (x: number[]) => -x.reduce((sum, val) => sum + (val - 0.5) ** 2, 0);

        // Test GA
        try {
          const ga = new GeneticAlgorithm(50, 0.1, 0.8, iterations);
          const gaStart = Date.now();
          const gaResult = ga.optimize(dimension, objFunc);
          results['genetic'] = {
            fitness: objFunc(gaResult),
            duration: Date.now() - gaStart,
            success: true,
          };
        } catch (e) {
          results['genetic'] = { success: false, error: String(e) };
        }

        // Test PSO
        try {
          const pso = new ParticleSwarmOptimizer(30, iterations);
          const psoStart = Date.now();
          const psoResult = pso.optimize(dimension, objFunc);
          results['pso'] = {
            fitness: objFunc(psoResult),
            duration: Date.now() - psoStart,
            success: true,
          };
        } catch (e) {
          results['pso'] = { success: false, error: String(e) };
        }

        res.json({
          dimension,
          iterations,
          results,
          totalDuration: Date.now() - startTime,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });
  }
}
