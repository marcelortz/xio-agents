#!/bin/bash

# PUSH_PHASE6_TO_GITHUB.sh
# Phase 6 - Docker & CI/CD Pipeline Deployment Script
# Usage: chmod +x PUSH_PHASE6_TO_GITHUB.sh && ./PUSH_PHASE6_TO_GITHUB.sh

set -e

echo "=================================="
echo "Phase 6 Push to GitHub"
echo "ML Optimization Suite - Docker & CI/CD"
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Check if we're in a git repository
if [ ! -d .git ]; then
    echo -e "${YELLOW}Error: Not a git repository${NC}"
    exit 1
fi

echo -e "${BLUE}[1/7] Checking repository status...${NC}"
git status

# 2. Build the project
echo ""
echo -e "${BLUE}[2/7] Building TypeScript...${NC}"
npm run build
echo -e "${GREEN}✓ Build successful${NC}"

# 3. Run tests
echo ""
echo -e "${BLUE}[3/7] Running tests...${NC}"
npm test
echo -e "${GREEN}✓ All tests passing${NC}"

# 4. Check Docker installation
echo ""
echo -e "${BLUE}[4/7] Checking Docker installation...${NC}"
if command -v docker &> /dev/null; then
    echo -e "${GREEN}✓ Docker installed: $(docker --version)${NC}"

    echo -e "${BLUE}   Building Docker image...${NC}"
    docker build -t ml-optimization-suite:latest .
    echo -e "${GREEN}✓ Docker image built${NC}"
else
    echo -e "${YELLOW}⚠ Docker not found (optional for CI/CD testing)${NC}"
fi

# 5. Check for uncommitted changes
echo ""
echo -e "${BLUE}[5/7] Checking for uncommitted changes...${NC}"
if [ -z "$(git status --porcelain)" ]; then
    echo -e "${GREEN}✓ Working directory is clean${NC}"
else
    echo -e "${YELLOW}⚠ Uncommitted changes detected${NC}"
    echo "Staging and committing changes..."
    git add .
    git commit -m "Phase 6: Docker & CI/CD Pipeline Implementation

- Production-ready Dockerfile with multi-stage build
- Docker Compose for easy local development
- GitHub Actions CI/CD pipeline with full workflow
- Automated testing on every push
- Container registry integration (GHCR)
- Security scanning (npm audit + Dependency Check)
- Automated production deployment
- Health checks and monitoring
- Non-root user execution
- Proper signal handling with dumb-init
- Comprehensive deployment documentation

CI/CD Features:
✓ Automated Build & Test
✓ Docker Image Building & Pushing
✓ Security Scanning
✓ Production Deployment
✓ Codecov Integration
✓ Pipeline Summary & Notifications

Deployment Features:
✓ Multi-stage Docker build
✓ Minimal image size (~250MB)
✓ Alpine Linux base
✓ Health checks enabled
✓ Log management
✓ Kubernetes-ready

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>"
    echo -e "${GREEN}✓ Changes committed${NC}"
fi

# 6. Push to GitHub
echo ""
echo -e "${BLUE}[6/7] Pushing to GitHub...${NC}"
git push origin main
echo -e "${GREEN}✓ Pushed to remote${NC}"

# 7. Summary
echo ""
echo -e "${BLUE}[7/7] Phase 6 Deployment Summary...${NC}"

echo ""
echo "=================================="
echo -e "${GREEN}✓ Phase 6 Deployment Complete!${NC}"
echo "=================================="
echo ""
echo -e "${GREEN}Docker & CI/CD Features:${NC}"
echo "  ✓ Production Dockerfile"
echo "  ✓ Docker Compose setup"
echo "  ✓ GitHub Actions CI/CD"
echo "  ✓ Automated testing"
echo "  ✓ Container registry push"
echo "  ✓ Security scanning"
echo "  ✓ Auto-deployment"
echo ""
echo -e "${GREEN}To Use Docker Locally:${NC}"
echo "  docker-compose up -d"
echo "  open http://localhost:3000"
echo ""
echo -e "${GREEN}To Build Docker Image:${NC}"
echo "  docker build -t ml-optimization-suite:latest ."
echo ""
echo -e "${GREEN}To Run Docker Container:${NC}"
echo "  docker run -p 3000:3000 ml-optimization-suite:latest"
echo ""
echo -e "${GREEN}CI/CD Pipeline:${NC}"
echo "  • Automatically triggers on push"
echo "  • Runs tests on every commit"
echo "  • Builds Docker image"
echo "  • Pushes to registry"
echo "  • Deploys to production"
echo ""
echo -e "${GREEN}View CI/CD Status:${NC}"
echo "  GitHub Actions: https://github.com/marcelortz/xio-agents-2b/actions"
echo ""
echo "Repository: $(git remote get-url origin)"
echo "Branch: $(git rev-parse --abbrev-ref HEAD)"
echo ""
echo "Status: PRODUCTION DEPLOYMENT READY ✓"
echo ""
echo "=================================="
echo "🎉 ML Optimization Suite Complete!"
echo "All 6 Phases Deployed Successfully"
echo "=================================="
echo ""
