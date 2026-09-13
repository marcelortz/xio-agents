const express = require('express');

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

console.log('Starting server...');
console.log('Node version:', process.version);
console.log('Environment:', process.env.NODE_ENV || 'development');
console.log('Port:', port);

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    port: port,
    nodeVersion: process.version
  });
});

app.get('/', (req, res) => {
  res.json({
    name: 'XIO Agents API',
    version: '1.0.0',
    status: 'online'
  });
});

app.get('/api', (req, res) => {
  res.json({
    message: 'XIO Agents API is running',
    timestamp: new Date().toISOString()
  });
});

const server = app.listen(port, '0.0.0.0', () => {
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

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
  process.exit(1);
});
