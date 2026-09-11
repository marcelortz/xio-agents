import request from 'supertest';
import { MLOptimizationAPI } from '../src/api/server';

describe('ML Optimization Suite REST API - Phase 4', () => {
  let api: MLOptimizationAPI;
  let app: any;

  beforeAll(() => {
    api = new MLOptimizationAPI(3001);
    app = api.getApp();
  });

  // ==========================================
  // HEALTH AND INFO ENDPOINTS
  // ==========================================
  describe('Health & Info Endpoints', () => {
    test('should return health status', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
    });

    test('should return API info', async () => {
      const response = await request(app).get('/api/info');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('algorithms');
      expect(response.body.algorithms).toContain('genetic-algorithm');
    });

    test('should list all algorithms', async () => {
      const response = await request(app).get('/api/algorithms');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('name');
      expect(response.body[0]).toHaveProperty('description');
    });
  });

  // ==========================================
  // OPTIMIZATION ENDPOINT TESTS
  // ==========================================
  describe('Single Algorithm Optimization', () => {
    test('should optimize with genetic algorithm', async () => {
      const response = await request(app)
        .post('/api/optimize')
        .send({
          algorithm: 'genetic-algorithm',
          dimension: 5,
          maxIterations: 50,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('algorithm', 'genetic-algorithm');
      expect(response.body).toHaveProperty('solution');
      expect(response.body.solution).toHaveLength(5);
      expect(response.body).toHaveProperty('fitness');
      expect(response.body).toHaveProperty('duration');
      expect(response.body).toHaveProperty('timestamp');
    });

    test('should optimize with particle swarm', async () => {
      const response = await request(app)
        .post('/api/optimize')
        .send({
          algorithm: 'particle-swarm',
          dimension: 5,
          maxIterations: 50,
        });

      expect(response.status).toBe(200);
      expect(response.body.algorithm).toBe('particle-swarm');
      expect(response.body.solution).toHaveLength(5);
    });

    test('should optimize with simulated annealing', async () => {
      const response = await request(app)
        .post('/api/optimize')
        .send({
          algorithm: 'simulated-annealing',
          dimension: 5,
          maxIterations: 50,
        });

      expect(response.status).toBe(200);
      expect(response.body.algorithm).toBe('simulated-annealing');
      expect(response.body.solution).toHaveLength(5);
    });

    test('should optimize with ant colony', async () => {
      const response = await request(app)
        .post('/api/optimize')
        .send({
          algorithm: 'ant-colony',
          dimension: 5,
          maxIterations: 50,
        });

      expect(response.status).toBe(200);
      expect(response.body.algorithm).toBe('ant-colony');
      expect(response.body.solution).toHaveLength(5);
    });

    test('should optimize with differential evolution', async () => {
      const response = await request(app)
        .post('/api/optimize')
        .send({
          algorithm: 'differential-evolution',
          dimension: 5,
          maxIterations: 50,
        });

      expect(response.status).toBe(200);
      expect(response.body.algorithm).toBe('differential-evolution');
      expect(response.body.solution).toHaveLength(5);
    });

    test('should optimize with harmony search', async () => {
      const response = await request(app)
        .post('/api/optimize')
        .send({
          algorithm: 'harmony-search',
          dimension: 5,
          maxIterations: 50,
        });

      expect(response.status).toBe(200);
      expect(response.body.algorithm).toBe('harmony-search');
      expect(response.body.solution).toHaveLength(5);
    });

    test('should optimize with tabu search', async () => {
      const response = await request(app)
        .post('/api/optimize')
        .send({
          algorithm: 'tabu-search',
          dimension: 5,
          maxIterations: 50,
        });

      expect(response.status).toBe(200);
      expect(response.body.algorithm).toBe('tabu-search');
      expect(response.body.solution).toHaveLength(5);
    });

    test('should handle custom parameters', async () => {
      const response = await request(app)
        .post('/api/optimize')
        .send({
          algorithm: 'genetic-algorithm',
          dimension: 5,
          maxIterations: 50,
          parameters: {
            populationSize: 30,
            mutationRate: 0.15,
            crossoverRate: 0.85,
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.solution).toHaveLength(5);
    });

    test('should handle missing algorithm', async () => {
      const response = await request(app)
        .post('/api/optimize')
        .send({
          dimension: 5,
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    test('should handle missing dimension', async () => {
      const response = await request(app)
        .post('/api/optimize')
        .send({
          algorithm: 'genetic-algorithm',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    test('should return valid solution bounds', async () => {
      const response = await request(app)
        .post('/api/optimize')
        .send({
          algorithm: 'genetic-algorithm',
          dimension: 10,
          maxIterations: 50,
        });

      expect(response.status).toBe(200);
      const isValid = response.body.solution.every((val: number) => val >= 0 && val <= 1);
      expect(isValid).toBe(true);
    });

    test('should have reasonable fitness value', async () => {
      const response = await request(app)
        .post('/api/optimize')
        .send({
          algorithm: 'genetic-algorithm',
          dimension: 5,
          maxIterations: 50,
        });

      expect(response.status).toBe(200);
      expect(response.body.fitness).toBeGreaterThanOrEqual(0);
      expect(response.body.fitness).toBeLessThanOrEqual(5);
    });

    test('should record execution time', async () => {
      const response = await request(app)
        .post('/api/optimize')
        .send({
          algorithm: 'genetic-algorithm',
          dimension: 5,
          maxIterations: 50,
        });

      expect(response.status).toBe(200);
      expect(response.body.duration).toBeGreaterThan(0);
      expect(response.body.duration).toBeLessThan(10000);
    });
  });

  // ==========================================
  // BATCH OPTIMIZATION ENDPOINT
  // ==========================================
  describe('Batch Optimization', () => {
    test('should optimize multiple algorithms', async () => {
      const response = await request(app)
        .post('/api/batch-optimize')
        .send({
          algorithms: ['genetic-algorithm', 'particle-swarm', 'simulated-annealing'],
          dimension: 5,
          maxIterations: 50,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('results');
      expect(Array.isArray(response.body.results)).toBe(true);
      expect(response.body.results).toHaveLength(3);
      expect(response.body).toHaveProperty('totalTime');
      expect(response.body).toHaveProperty('timestamp');
    });

    test('should return valid results for all algorithms', async () => {
      const response = await request(app)
        .post('/api/batch-optimize')
        .send({
          algorithms: ['genetic-algorithm', 'particle-swarm'],
          dimension: 5,
          maxIterations: 50,
        });

      expect(response.status).toBe(200);
      response.body.results.forEach((result: any) => {
        expect(result).toHaveProperty('algorithm');
        expect(result).toHaveProperty('solution');
        expect(result).toHaveProperty('fitness');
        expect(result).toHaveProperty('duration');
      });
    });

    test('should handle missing algorithms array', async () => {
      const response = await request(app)
        .post('/api/batch-optimize')
        .send({
          dimension: 5,
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  // ==========================================
  // COMPARISON ENDPOINT
  // ==========================================
  describe('Algorithm Comparison', () => {
    test('should compare multiple algorithms', async () => {
      const response = await request(app)
        .post('/api/compare')
        .send({
          algorithms: ['genetic-algorithm', 'particle-swarm', 'harmony-search'],
          dimension: 5,
          iterations: 50,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('comparison');
      expect(response.body).toHaveProperty('best');
      expect(response.body.comparison).toHaveLength(3);
    });

    test('should rank algorithms by fitness', async () => {
      const response = await request(app)
        .post('/api/compare')
        .send({
          algorithms: ['genetic-algorithm', 'particle-swarm'],
          dimension: 5,
          iterations: 50,
        });

      expect(response.status).toBe(200);
      const first = response.body.comparison[0];
      const second = response.body.comparison[1];
      expect(first.fitness).toBeGreaterThanOrEqual(second.fitness);
    });

    test('should identify best algorithm', async () => {
      const response = await request(app)
        .post('/api/compare')
        .send({
          algorithms: ['genetic-algorithm', 'particle-swarm', 'simulated-annealing'],
          dimension: 5,
          iterations: 50,
        });

      expect(response.status).toBe(200);
      expect(response.body.best).toHaveProperty('algorithm');
      expect(response.body.best).toHaveProperty('fitness');
      expect(response.body.best.algorithm).toBe(response.body.comparison[0].algorithm);
    });

    test('should handle missing algorithms', async () => {
      const response = await request(app)
        .post('/api/compare')
        .send({
          dimension: 5,
          iterations: 50,
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  // ==========================================
  // ERROR HANDLING
  // ==========================================
  describe('Error Handling', () => {
    test('should return 404 for invalid endpoint', async () => {
      const response = await request(app).get('/api/invalid');
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });

    test('should handle invalid algorithm', async () => {
      const response = await request(app)
        .post('/api/optimize')
        .send({
          algorithm: 'invalid-algorithm',
          dimension: 5,
        });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });

    test('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/optimize')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }');

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  // ==========================================
  // PERFORMANCE TESTS
  // ==========================================
  describe('API Performance', () => {
    test('should respond within reasonable time', async () => {
      const startTime = Date.now();
      const response = await request(app)
        .post('/api/optimize')
        .send({
          algorithm: 'genetic-algorithm',
          dimension: 5,
          maxIterations: 50,
        });
      const responseTime = Date.now() - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(5000); // Should respond within 5 seconds
    });

    test('should handle concurrent requests', async () => {
      const requests = Array(5).fill(null).map(() =>
        request(app)
          .post('/api/optimize')
          .send({
            algorithm: 'genetic-algorithm',
            dimension: 5,
            maxIterations: 50,
          })
      );

      const responses = await Promise.all(requests);
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('solution');
      });
    });
  });
});
