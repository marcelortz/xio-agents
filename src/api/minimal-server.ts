import express from 'express';

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

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
    status: 'online'
  });
});

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
