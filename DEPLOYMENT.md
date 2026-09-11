# ML Optimization Suite - Deployment Guide

## Phase 6: Docker & CI/CD

This guide covers containerization and automated deployment of the ML Optimization Suite.

---

## 🐳 Docker Deployment

### Prerequisites
- Docker 20.10+
- Docker Compose 1.29+
- Git

### Quick Start

```bash
# Clone the repository
git clone https://github.com/marcelortz/xio-agents-2b.git
cd xio-agents-2b

# Build and run with Docker Compose
docker-compose up -d

# Access the application
open http://localhost:3000
```

### Docker Commands

```bash
# Build image
docker build -t ml-optimization-suite:latest .

# Run container
docker run -p 3000:3000 ml-optimization-suite:latest

# Run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f api

# Stop container
docker-compose down
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

The `.github/workflows/ci.yml` file defines the automated pipeline:

**Steps:**
1. **Lint & Build** - TypeScript compilation
2. **Testing** - Run 234 tests
3. **Docker Build** - Multi-stage build
4. **Security Scan** - npm audit + dependency check
5. **Deployment** - Deploy to production

### Triggers

- **Push to main/develop** - Full CI/CD pipeline
- **Pull Request** - Lint, build, test (no deploy)

### Pipeline Status

View CI/CD status: https://github.com/marcelortz/xio-agents-2b/actions

---

## 📦 Docker Image Details

### Image Specs
- **Base**: Node.js 18 Alpine (minimal size)
- **Size**: ~250MB (optimized)
- **User**: Non-root (nodejs)
- **Signals**: Handled by dumb-init
- **Health**: HTTP health check every 30s

### Environment Variables

```bash
NODE_ENV=production
PORT=3000
```

### Exposed Ports
- **3000** - API & Dashboard

### Volumes
- `/app/logs` - Application logs

---

## 🚀 Production Deployment

### Docker Hub / Container Registry

```bash
# Log in to registry
docker login ghcr.io

# Push image
docker push ghcr.io/marcelortz/xio-agents-2b:latest

# Pull from registry
docker pull ghcr.io/marcelortz/xio-agents-2b:latest
```

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ml-optimization-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ml-optimization-api
  template:
    metadata:
      labels:
        app: ml-optimization-api
    spec:
      containers:
      - name: api
        image: ghcr.io/marcelortz/xio-agents-2b:latest
        ports:
        - containerPort: 3000
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 10
```

### Environment Setup

```bash
# Development
docker-compose up

# Staging
docker build -t ml-optimization:staging .
docker run -p 3000:3000 ml-optimization:staging

# Production
docker build -t ml-optimization:v1.0.0 .
docker push registry.example.com/ml-optimization:v1.0.0
```

---

## 🔍 Monitoring

### Health Check

```bash
curl http://localhost:3000/health
```

### Logs

```bash
# Docker logs
docker-compose logs -f api

# See last 100 lines
docker-compose logs --tail=100 api
```

### Performance Metrics

- **Response Time**: < 1s (avg)
- **Memory Usage**: ~150MB
- **CPU Usage**: < 50%

---

## 🔐 Security

### Best Practices

✅ Non-root user execution  
✅ Multi-stage build (smaller images)  
✅ Security scanning in CI/CD  
✅ Health checks enabled  
✅ Proper signal handling  
✅ Minimal attack surface  

### Secrets Management

```bash
# Never commit secrets
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore

# Use Docker secrets in production
docker secret create api_key /path/to/secret
```

---

## 📊 Performance Optimization

### Image Optimization
- Multi-stage build reduces size
- Alpine Linux base
- Prod dependencies only
- Minimal layer count

### Runtime Optimization
- Non-blocking I/O
- Connection pooling
- Health checks
- Proper logging

---

## 🧪 Testing the Deployment

```bash
# Build
docker build -t test-image .

# Run
docker run -d -p 3000:3000 --name test-api test-image

# Test health
curl http://localhost:3000/health

# Test API
curl -X POST http://localhost:3000/api/optimize \
  -H 'Content-Type: application/json' \
  -d '{"algorithm": "genetic-algorithm", "dimension": 5}'

# Cleanup
docker stop test-api
docker rm test-api
```

---

## 📚 Resources

- [Docker Docs](https://docs.docker.com/)
- [Docker Compose Docs](https://docs.docker.com/compose/)
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Kubernetes Docs](https://kubernetes.io/docs/)

---

## Support

For issues or questions:
- GitHub Issues: https://github.com/marcelortz/xio-agents-2b/issues
- Docker Hub: ghcr.io/marcelortz/xio-agents-2b

**Status:** ✅ Production Ready

Generated: 2026-09-11  
Version: Phase 6
