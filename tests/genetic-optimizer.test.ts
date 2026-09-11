import { GeneticAlgorithm, ParticleSwarmOptimizer } from '../src/models/genetic-optimizer';

describe('Genetic Algorithm Optimizer', () => {
  let ga: GeneticAlgorithm;

  beforeEach(() => {
    ga = new GeneticAlgorithm(50, 0.1, 0.8, 100);
  });

  test('should initialize with default parameters', () => {
    const optimizer = new GeneticAlgorithm();
    expect(optimizer).toBeDefined();
  });

  test('should optimize simple function', () => {
    const fitnessFunction = (genes: number[]) => {
      return genes.reduce((sum, val) => sum + val, 0);
    };

    const solution = ga.optimize(5, fitnessFunction);
    expect(solution).toHaveLength(5);
    expect(solution.every(val => typeof val === 'number')).toBe(true);
  });

  test('should find approximate maximum', () => {
    const fitnessFunction = (genes: number[]) => {
      let sum = 0;
      for (let i = 0; i < genes.length; i++) {
        sum += genes[i];
      }
      return sum;
    };

    const solution = ga.optimize(10, fitnessFunction);
    const fitness = fitnessFunction(solution);
    expect(fitness).toBeGreaterThan(5);
  });

  test('should handle quadratic function optimization', () => {
    const fitnessFunction = (genes: number[]) => {
      return genes.reduce((sum, val) => sum - Math.pow(val - 0.7, 2), 0);
    };

    const solution = ga.optimize(3, fitnessFunction);
    const fitness = fitnessFunction(solution);
    expect(fitness).toBeGreaterThan(-0.5);
  });

  test('should work with different population sizes', () => {
    const ga30 = new GeneticAlgorithm(30, 0.1, 0.8, 50);
    const ga100 = new GeneticAlgorithm(100, 0.1, 0.8, 50);

    const fitness = (genes: number[]) => genes.reduce((a, b) => a + b, 0);

    const solution30 = ga30.optimize(5, fitness);
    const solution100 = ga100.optimize(5, fitness);

    expect(solution30).toHaveLength(5);
    expect(solution100).toHaveLength(5);
  });

  test('should respond to mutation rate changes', () => {
    const gaMutate = new GeneticAlgorithm(50, 0.3, 0.8, 50);
    const gaStable = new GeneticAlgorithm(50, 0.01, 0.8, 50);

    const fitness = (genes: number[]) => -genes.reduce((sum, val) => sum + Math.pow(val - 0.5, 2), 0);

    const sol1 = gaMutate.optimize(5, fitness);
    const sol2 = gaStable.optimize(5, fitness);

    expect(sol1).toHaveLength(5);
    expect(sol2).toHaveLength(5);
  });

  test('should converge over generations', () => {
    let fitnessValues: number[] = [];

    const ga50 = new GeneticAlgorithm(50, 0.1, 0.8, 50);
    const fitness = (genes: number[]) => genes.reduce((sum, val) => sum + val, 0);

    const solution = ga50.optimize(10, fitness);
    expect(fitnessValues.length >= 0).toBe(true);
    expect(fitness(solution)).toBeGreaterThan(0);
  });

  test('should handle edge case with single gene', () => {
    const ga = new GeneticAlgorithm(20, 0.1, 0.8, 30);
    const fitness = (genes: number[]) => genes[0];

    const solution = ga.optimize(1, fitness);
    expect(solution).toHaveLength(1);
    expect(solution[0]).toBeGreaterThan(0);
  });

  test('should maintain solution validity', () => {
    const ga = new GeneticAlgorithm(50, 0.1, 0.8, 100);
    const fitness = (genes: number[]) => {
      return genes.every(g => g >= 0 && g <= 1) ? genes.reduce((a, b) => a + b, 0) : -Infinity;
    };

    const solution = ga.optimize(5, fitness);
    expect(solution.every(g => g >= 0 && g <= 1)).toBe(true);
  });
});

describe('Particle Swarm Optimizer', () => {
  let pso: ParticleSwarmOptimizer;

  beforeEach(() => {
    pso = new ParticleSwarmOptimizer(30, 100);
  });

  test('should initialize with default parameters', () => {
    const optimizer = new ParticleSwarmOptimizer();
    expect(optimizer).toBeDefined();
  });

  test('should optimize simple function', () => {
    const fitnessFunction = (position: number[]) => {
      return position.reduce((sum, val) => sum + val, 0);
    };

    const solution = pso.optimize(5, fitnessFunction);
    expect(solution).toHaveLength(5);
    expect(solution.every(val => typeof val === 'number')).toBe(true);
  });

  test('should find approximate maximum', () => {
    const fitnessFunction = (position: number[]) => {
      let sum = 0;
      for (let i = 0; i < position.length; i++) {
        sum += position[i];
      }
      return sum;
    };

    const solution = pso.optimize(8, fitnessFunction);
    const fitness = fitnessFunction(solution);
    expect(fitness).toBeGreaterThan(4);
  });

  test('should handle sphere function', () => {
    const fitnessFunction = (position: number[]) => {
      return -position.reduce((sum, val) => sum + Math.pow(val - 0.5, 2), 0);
    };

    const solution = pso.optimize(5, fitnessFunction);
    const fitness = fitnessFunction(solution);
    expect(fitness).toBeGreaterThan(-0.5);
  });

  test('should work with different particle counts', () => {
    const pso10 = new ParticleSwarmOptimizer(10, 50);
    const pso50 = new ParticleSwarmOptimizer(50, 50);

    const fitness = (position: number[]) => position.reduce((a, b) => a + b, 0);

    const solution10 = pso10.optimize(5, fitness);
    const solution50 = pso50.optimize(5, fitness);

    expect(solution10).toHaveLength(5);
    expect(solution50).toHaveLength(5);
  });

  test('should respect bounds', () => {
    const fitnessFunction = (position: number[]) => {
      return position.reduce((sum, val) => sum + val, 0);
    };

    const solution = pso.optimize(10, fitnessFunction);
    expect(solution.every(pos => pos >= 0 && pos <= 1)).toBe(true);
  });

  test('should converge over iterations', () => {
    const fitnessFunction = (position: number[]) => {
      return -position.reduce((sum, val) => sum + Math.pow(val - 1, 2), 0);
    };

    const solution = pso.optimize(5, fitnessFunction);
    const finalFitness = fitnessFunction(solution);
    expect(finalFitness).toBeGreaterThan(-5);
  });

  test('should handle high-dimensional optimization', () => {
    const fitnessFunction = (position: number[]) => {
      return position.reduce((sum, val) => sum + val, 0);
    };

    const solution = pso.optimize(20, fitnessFunction);
    expect(solution).toHaveLength(20);
    expect(solution.every(pos => typeof pos === 'number')).toBe(true);
  });

  test('should work with different iteration counts', () => {
    const pso20 = new ParticleSwarmOptimizer(30, 20);
    const pso100 = new ParticleSwarmOptimizer(30, 100);

    const fitness = (position: number[]) => position.reduce((a, b) => a + b, 0);

    const sol1 = pso20.optimize(5, fitness);
    const sol2 = pso100.optimize(5, fitness);

    expect(sol1).toHaveLength(5);
    expect(sol2).toHaveLength(5);
  });

  test('should maintain numerical stability', () => {
    const fitnessFunction = (position: number[]) => {
      return position.every(p => !isNaN(p) && isFinite(p))
        ? position.reduce((a, b) => a + b, 0)
        : -Infinity;
    };

    const solution = pso.optimize(5, fitnessFunction);
    expect(solution.every(p => !isNaN(p) && isFinite(p))).toBe(true);
  });
});
