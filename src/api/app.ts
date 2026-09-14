import express, { Express } from 'express';
import { OptimizationEndpoints } from './optimization-endpoints';

export function createApp(): Express {
  const app = express();

  app.use(express.json({ limit: '10mb' }));

  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      port: parseInt(process.env.PORT || '3000', 10),
      env: process.env.NODE_ENV || 'development'
    });
  });

  app.get('/', (req, res) => {
    res.json({
      name: 'XIO Agents API',
      version: '1.0.0',
      status: 'online',
      endpoints: {
        algorithms: 'GET /api/algorithms',
        optimize: 'POST /api/optimize',
        batch: 'POST /api/optimize/batch',
        compare: 'POST /api/optimize/compare',
        health: 'GET /health'
      }
    });
  });

  OptimizationEndpoints.registerEndpoints(app);

  return app;
}
