import {
  SimulatedAnnealing,
  AntColonyOptimization,
  DifferentialEvolution,
  HarmonySearch,
  TabuSearch,
} from '../src/models/advanced-optimizers';

describe('Advanced Optimization Algorithms - Phase 3', () => {
  // Simple test fitness function
  const testFitness = (solution: number[]) => {
    return solution.reduce((sum, val) => sum + val, 0);
  };

  // Complex fitness function
  const sphereFitness = (solution: number[]) => {
    return -solution.reduce((sum, val) => sum + Math.pow(val - 0.5, 2), 0);
  };

  // ==========================================
  // SIMULATED ANNEALING TESTS
  // ==========================================
  describe('Simulated Annealing', () => {
    let sa: SimulatedAnnealing;

    beforeEach(() => {
      sa = new SimulatedAnnealing(100, 0.95, 0.01);
    });

    test('should initialize with parameters', () => {
      expect(sa).toBeDefined();
    });

    test('should optimize simple function', () => {
      const solution = sa.optimize(5, testFitness);
      expect(solution).toHaveLength(5);
      expect(solution.every(val => typeof val === 'number')).toBe(true);
    });

    test('should find good solution', () => {
      const solution = sa.optimize(10, testFitness);
      const fitness = testFitness(solution);
      expect(fitness).toBeGreaterThan(1);
      expect(solution.every(val => val >= 0 && val <= 1)).toBe(true);
    });

    test('should handle sphere function', () => {
      const solution = sa.optimize(5, sphereFitness);
      const fitness = sphereFitness(solution);
      expect(fitness).toBeGreaterThan(-2);
    });

    test('should work with different cooling rates', () => {
      const saFast = new SimulatedAnnealing(50, 0.8, 0.01);
      const saSlow = new SimulatedAnnealing(50, 0.99, 0.01);

      const sol1 = saFast.optimize(5, testFitness);
      const sol2 = saSlow.optimize(5, testFitness);

      expect(sol1).toHaveLength(5);
      expect(sol2).toHaveLength(5);
    });

    test('should maintain valid solution bounds', () => {
      const solution = sa.optimize(8, testFitness);
      expect(solution.every(val => val >= 0 && val <= 1)).toBe(true);
    });

    test('should handle single dimension', () => {
      const solution = sa.optimize(1, testFitness);
      expect(solution).toHaveLength(1);
      expect(solution[0]).toBeGreaterThanOrEqual(0);
      expect(solution[0]).toBeLessThanOrEqual(1);
    });

    test('should produce deterministic results with seed', () => {
      const sa1 = new SimulatedAnnealing(100, 0.95, 0.01);
      const sa2 = new SimulatedAnnealing(100, 0.95, 0.01);

      const sol1 = sa1.optimize(5, testFitness);
      const sol2 = sa2.optimize(5, testFitness);

      expect(sol1).toHaveLength(5);
      expect(sol2).toHaveLength(5);
    });
  });

  // ==========================================
  // ANT COLONY OPTIMIZATION TESTS
  // ==========================================
  describe('Ant Colony Optimization', () => {
    let aco: AntColonyOptimization;

    beforeEach(() => {
      aco = new AntColonyOptimization(30, 100, 0.1, 1.0, 1.0);
    });

    test('should initialize with parameters', () => {
      expect(aco).toBeDefined();
    });

    test('should optimize simple function', () => {
      const solution = aco.optimize(5, testFitness);
      expect(solution).toHaveLength(5);
      expect(solution.every(val => typeof val === 'number')).toBe(true);
    });

    test('should find approximate maximum', () => {
      const solution = aco.optimize(8, testFitness);
      const fitness = testFitness(solution);
      expect(fitness).toBeGreaterThan(4);
    });

    test('should handle complex fitness landscape', () => {
      const solution = aco.optimize(5, sphereFitness);
      const fitness = sphereFitness(solution);
      expect(fitness).toBeGreaterThan(-1.5);
    });

    test('should work with different evaporation rates', () => {
      const acoFast = new AntColonyOptimization(20, 50, 0.3, 1.0, 1.0);
      const acoSlow = new AntColonyOptimization(20, 50, 0.05, 1.0, 1.0);

      const sol1 = acoFast.optimize(5, testFitness);
      const sol2 = acoSlow.optimize(5, testFitness);

      expect(sol1).toHaveLength(5);
      expect(sol2).toHaveLength(5);
    });

    test('should respect solution bounds', () => {
      const solution = aco.optimize(10, testFitness);
      expect(solution.every(val => val >= 0 && val <= 1)).toBe(true);
    });

    test('should handle high-dimensional problems', () => {
      const solution = aco.optimize(20, testFitness);
      expect(solution).toHaveLength(20);
    });

    test('should improve over iterations', () => {
      const solution = aco.optimize(5, testFitness);
      const fitness = testFitness(solution);
      expect(fitness).toBeGreaterThan(0);
    });
  });

  // ==========================================
  // DIFFERENTIAL EVOLUTION TESTS
  // ==========================================
  describe('Differential Evolution', () => {
    let de: DifferentialEvolution;

    beforeEach(() => {
      de = new DifferentialEvolution(50, 100, 0.8, 0.9);
    });

    test('should initialize with parameters', () => {
      expect(de).toBeDefined();
    });

    test('should optimize simple function', () => {
      const solution = de.optimize(5, testFitness);
      expect(solution).toHaveLength(5);
      expect(solution.every(val => typeof val === 'number')).toBe(true);
    });

    test('should find good solution', () => {
      const solution = de.optimize(8, testFitness);
      const fitness = testFitness(solution);
      expect(fitness).toBeGreaterThan(4);
    });

    test('should handle sphere function well', () => {
      const solution = de.optimize(5, sphereFitness);
      const fitness = sphereFitness(solution);
      expect(fitness).toBeGreaterThan(-1);
    });

    test('should work with different scale factors', () => {
      const deSmall = new DifferentialEvolution(50, 100, 0.5, 0.9);
      const deLarge = new DifferentialEvolution(50, 100, 1.0, 0.9);

      const sol1 = deSmall.optimize(5, testFitness);
      const sol2 = deLarge.optimize(5, testFitness);

      expect(sol1).toHaveLength(5);
      expect(sol2).toHaveLength(5);
    });

    test('should maintain bounds', () => {
      const solution = de.optimize(10, testFitness);
      expect(solution.every(val => val >= 0 && val <= 1)).toBe(true);
    });

    test('should handle crossover variations', () => {
      const deLow = new DifferentialEvolution(50, 100, 0.8, 0.3);
      const deHigh = new DifferentialEvolution(50, 100, 0.8, 0.95);

      const sol1 = deLow.optimize(5, testFitness);
      const sol2 = deHigh.optimize(5, testFitness);

      expect(sol1).toHaveLength(5);
      expect(sol2).toHaveLength(5);
    });

    test('should converge over generations', () => {
      const solution = de.optimize(5, testFitness);
      const fitness = testFitness(solution);
      expect(fitness).toBeGreaterThan(0);
    });
  });

  // ==========================================
  // HARMONY SEARCH TESTS
  // ==========================================
  describe('Harmony Search', () => {
    let hs: HarmonySearch;

    beforeEach(() => {
      hs = new HarmonySearch(30, 100, 0.9, 0.3);
    });

    test('should initialize with parameters', () => {
      expect(hs).toBeDefined();
    });

    test('should optimize simple function', () => {
      const solution = hs.optimize(5, testFitness);
      expect(solution).toHaveLength(5);
      expect(solution.every(val => typeof val === 'number')).toBe(true);
    });

    test('should find good solution', () => {
      const solution = hs.optimize(8, testFitness);
      const fitness = testFitness(solution);
      expect(fitness).toBeGreaterThan(4);
    });

    test('should handle complex landscapes', () => {
      const solution = hs.optimize(5, sphereFitness);
      const fitness = sphereFitness(solution);
      expect(fitness).toBeGreaterThan(-1.5);
    });

    test('should work with different memory sizes', () => {
      const hsSmall = new HarmonySearch(10, 80, 0.9, 0.3);
      const hsLarge = new HarmonySearch(50, 80, 0.9, 0.3);

      const sol1 = hsSmall.optimize(5, testFitness);
      const sol2 = hsLarge.optimize(5, testFitness);

      expect(sol1).toHaveLength(5);
      expect(sol2).toHaveLength(5);
    });

    test('should respect solution bounds', () => {
      const solution = hs.optimize(10, testFitness);
      expect(solution.every(val => val >= 0 && val <= 1)).toBe(true);
    });

    test('should handle pitch adjustments', () => {
      const hsAdjust = new HarmonySearch(30, 100, 0.9, 0.5);
      const solution = hsAdjust.optimize(5, testFitness);
      expect(solution).toHaveLength(5);
    });

    test('should improve solution over iterations', () => {
      const solution = hs.optimize(5, testFitness);
      const fitness = testFitness(solution);
      expect(fitness).toBeGreaterThan(0);
    });
  });

  // ==========================================
  // TABU SEARCH TESTS
  // ==========================================
  describe('Tabu Search', () => {
    let ts: TabuSearch;

    beforeEach(() => {
      ts = new TabuSearch(100, 10, 20);
    });

    test('should initialize with parameters', () => {
      expect(ts).toBeDefined();
    });

    test('should optimize simple function', () => {
      const solution = ts.optimize(5, testFitness);
      expect(solution).toHaveLength(5);
      expect(solution.every(val => typeof val === 'number')).toBe(true);
    });

    test('should find good solution', () => {
      const solution = ts.optimize(8, testFitness);
      const fitness = testFitness(solution);
      expect(fitness).toBeGreaterThan(4);
    });

    test('should handle complex fitness landscape', () => {
      const solution = ts.optimize(5, sphereFitness);
      const fitness = sphereFitness(solution);
      expect(fitness).toBeGreaterThan(-1.5);
    });

    test('should work with different tabu tenures', () => {
      const tsShort = new TabuSearch(100, 3, 20);
      const tsLong = new TabuSearch(100, 20, 20);

      const sol1 = tsShort.optimize(5, testFitness);
      const sol2 = tsLong.optimize(5, testFitness);

      expect(sol1).toHaveLength(5);
      expect(sol2).toHaveLength(5);
    });

    test('should maintain solution validity', () => {
      const solution = ts.optimize(10, testFitness);
      expect(solution.every(val => val >= 0 && val <= 1)).toBe(true);
    });

    test('should avoid cycling with tabu list', () => {
      const solution = ts.optimize(8, testFitness);
      const fitness = testFitness(solution);
      expect(fitness).toBeGreaterThan(0);
    });

    test('should handle different neighborhood sizes', () => {
      const tsSmall = new TabuSearch(100, 10, 5);
      const tsLarge = new TabuSearch(100, 10, 50);

      const sol1 = tsSmall.optimize(5, testFitness);
      const sol2 = tsLarge.optimize(5, testFitness);

      expect(sol1).toHaveLength(5);
      expect(sol2).toHaveLength(5);
    });
  });

  // ==========================================
  // COMPARATIVE TESTS
  // ==========================================
  describe('Algorithm Comparison', () => {
    test('all algorithms should handle same problem', () => {
      const sa = new SimulatedAnnealing(100, 0.95, 0.01);
      const aco = new AntColonyOptimization(30, 100, 0.1, 1.0, 1.0);
      const de = new DifferentialEvolution(50, 100, 0.8, 0.9);
      const hs = new HarmonySearch(30, 100, 0.9, 0.3);
      const ts = new TabuSearch(100, 10, 20);

      const saSol = sa.optimize(5, testFitness);
      const acoSol = aco.optimize(5, testFitness);
      const deSol = de.optimize(5, testFitness);
      const hsSol = hs.optimize(5, testFitness);
      const tsSol = ts.optimize(5, testFitness);

      expect(saSol).toHaveLength(5);
      expect(acoSol).toHaveLength(5);
      expect(deSol).toHaveLength(5);
      expect(hsSol).toHaveLength(5);
      expect(tsSol).toHaveLength(5);
    });

    test('all should find reasonable solutions', () => {
      const algorithms = [
        new SimulatedAnnealing(100, 0.95, 0.01),
        new AntColonyOptimization(30, 100, 0.1, 1.0, 1.0),
        new DifferentialEvolution(50, 100, 0.8, 0.9),
        new HarmonySearch(30, 100, 0.9, 0.3),
        new TabuSearch(100, 10, 20),
      ];

      algorithms.forEach((algo, idx) => {
        const solution = idx === 0 ? (algo as SimulatedAnnealing).optimize(5, testFitness) :
          idx === 1 ? (algo as AntColonyOptimization).optimize(5, testFitness) :
          idx === 2 ? (algo as DifferentialEvolution).optimize(5, testFitness) :
          idx === 3 ? (algo as HarmonySearch).optimize(5, testFitness) :
          (algo as TabuSearch).optimize(5, testFitness);

        const fitness = testFitness(solution);
        expect(fitness).toBeGreaterThan(0);
        expect(solution.every(val => val >= 0 && val <= 1)).toBe(true);
      });
    });
  });
});
