import { createApp } from './app';

const app = createApp();
const port = parseInt(process.env.PORT || '3000', 10);

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
