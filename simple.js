const http = require('http');

const port = parseInt(process.env.PORT || '3000', 10);

const server = http.createServer((req, res) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);

  res.writeHead(200, { 'Content-Type': 'application/json' });

  if (req.url === '/health') {
    res.end(JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      port: port
    }));
  } else if (req.url === '/') {
    res.end(JSON.stringify({
      name: 'XIO Agents API',
      version: '1.0.0',
      status: 'online'
    }));
  } else {
    res.end(JSON.stringify({
      message: 'XIO Agents API',
      path: req.url
    }));
  }
});

server.listen(port, '0.0.0.0', () => {
  console.log(`✅ Server listening on port ${port}`);
  console.log(`🔗 http://localhost:${port}/health`);
  console.log(`📡 http://localhost:${port}/`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM: Shutting down...');
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  console.log('SIGINT: Shutting down...');
  server.close(() => process.exit(0));
});

console.log('Server starting...');
console.log('Node version:', process.version);
console.log('Environment:', process.env.NODE_ENV || 'development');
