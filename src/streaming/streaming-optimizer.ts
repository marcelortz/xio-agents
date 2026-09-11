// Phase 7: Real-time Streaming Optimizer
// Emits progress updates during optimization for live dashboard updates

export interface OptimizationProgress {
  iteration: number;
  bestFitness: number;
  currentFitness: number;
  solution: number[];
  timestamp: number;
  elapsedMs: number;
}

export interface OptimizationResult {
  algorithm: string;
  fitness: number;
  solution: number[];
  totalIterations: number;
  totalTimeMs: number;
  history: OptimizationProgress[];
}

export type ProgressCallback = (progress: OptimizationProgress) => void;

export class StreamingOptimizer {
  private history: OptimizationProgress[] = [];
  private startTime: number = 0;
  private bestFitness: number = -Infinity;
  private bestSolution: number[] = [];

  async optimizeWithStreaming(
    algorithm: any,
    dimension: number,
    maxIterations: number,
    onProgress: ProgressCallback
  ): Promise<OptimizationResult> {
    this.history = [];
    this.startTime = Date.now();
    this.bestFitness = -Infinity;
    this.bestSolution = new Array(dimension).fill(0);

    // Create wrapper that captures progress
    let lastReportedIteration = 0;

    const wrappedOptimizer = {
      ...algorithm,
      optimize: (dim: number, objFunc: any) => {
        const result = algorithm.optimize(dim, objFunc);

        // Emit initial progress
        const progress: OptimizationProgress = {
          iteration: 0,
          bestFitness: result.fitness,
          currentFitness: result.fitness,
          solution: result.solution,
          timestamp: Date.now(),
          elapsedMs: Date.now() - this.startTime,
        };

        this.history.push(progress);
        this.bestFitness = result.fitness;
        this.bestSolution = result.solution;
        onProgress(progress);

        return result;
      },
    };

    // Run optimization with streaming
    const result = wrappedOptimizer.optimize(dimension, (x: number[]) => {
      // Objective function that tracks iterations
      lastReportedIteration++;

      // Report progress every iteration
      if (lastReportedIteration % 1 === 0) {
        const progress: OptimizationProgress = {
          iteration: lastReportedIteration,
          bestFitness: this.bestFitness,
          currentFitness: this.calculateFitness(x),
          solution: x,
          timestamp: Date.now(),
          elapsedMs: Date.now() - this.startTime,
        };

        this.history.push(progress);
        onProgress(progress);
      }

      return this.calculateFitness(x);
    });

    return {
      algorithm: algorithm.constructor.name,
      fitness: result.fitness,
      solution: result.solution,
      totalIterations: lastReportedIteration,
      totalTimeMs: Date.now() - this.startTime,
      history: this.history,
    };
  }

  private calculateFitness(solution: number[]): number {
    // Sphere function for testing
    return solution.reduce((sum, x) => sum + x * x, 0);
  }

  getHistory(): OptimizationProgress[] {
    return this.history;
  }

  clearHistory(): void {
    this.history = [];
    this.bestFitness = -Infinity;
    this.bestSolution = [];
  }
}

export function createStreamingOptimizer(): StreamingOptimizer {
  return new StreamingOptimizer();
}
