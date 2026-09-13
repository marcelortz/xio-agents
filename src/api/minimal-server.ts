import express from 'express';
import { OptimizationEndpoints } from './optimization-endpoints';

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '10mb' }));

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    port: port,
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

const server = app.listen(port, () => {
  console.log(`✅ Server running on port ${port}`);
  console.log(`🔗 Health check: http://localhost:${port}/health`);
  console.log(`📡 API root: http://localhost:${port}/`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
