#!/bin/bash

# PUSH_PHASE5_TO_GITHUB.sh
# Phase 5 - Web Dashboard Deployment Script
# Usage: chmod +x PUSH_PHASE5_TO_GITHUB.sh && ./PUSH_PHASE5_TO_GITHUB.sh

set -e

echo "=================================="
echo "Phase 5 Push to GitHub"
echo "ML Optimization Suite - Web Dashboard"
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

echo -e "${BLUE}[1/6] Checking repository status...${NC}"
git status

# 2. Build the project
echo ""
echo -e "${BLUE}[2/6] Building TypeScript...${NC}"
npm run build
echo -e "${GREEN}✓ Build successful${NC}"

# 3. Run tests
echo ""
echo -e "${BLUE}[3/6] Running tests...${NC}"
npm test
echo -e "${GREEN}✓ All tests passing${NC}"

# 4. Check for uncommitted changes
echo ""
echo -e "${BLUE}[4/6] Checking for uncommitted changes...${NC}"
if [ -z "$(git status --porcelain)" ]; then
    echo -e "${GREEN}✓ Working directory is clean${NC}"
else
    echo -e "${YELLOW}⚠ Uncommitted changes detected${NC}"
    echo "Staging and committing changes..."
    git add .
    git commit -m "Phase 5: Interactive Web Dashboard Implementation

- Beautiful, modern web dashboard
- Single optimization interface
- Batch optimization for all algorithms
- Algorithm comparison and ranking
- Real-time performance metrics
- Responsive design for all devices
- CORS-enabled API communication
- Real-time results visualization
- Static file serving from Express
- Interactive algorithm selection
- Performance tracking and display
- Full integration with Phase 4 API

Features:
✓ Single Algorithm Optimization
✓ Batch Optimization (all 7 algorithms)
✓ Algorithm Comparison & Ranking
✓ Real-time Performance Metrics
✓ Responsive Web Design
✓ Live API Integration
✓ Error Handling & Validation

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>"
    echo -e "${GREEN}✓ Changes committed${NC}"
fi

# 5. Push to GitHub
echo ""
echo -e "${BLUE}[5/6] Pushing to GitHub...${NC}"
git push origin main

# 6. Dashboard Information
echo ""
echo -e "${BLUE}[6/6] Phase 5 Deployment Summary...${NC}"

echo ""
echo "=================================="
echo -e "${GREEN}✓ Phase 5 Deployment Complete!${NC}"
echo "=================================="
echo ""
echo -e "${GREEN}Dashboard Features:${NC}"
echo "  • Single Algorithm Optimization"
echo "  • Batch Optimization (All 7 Algorithms)"
echo "  • Real-time Algorithm Comparison"
echo "  • Performance Metrics Display"
echo "  • Interactive UI Controls"
echo "  • Results Visualization"
echo "  • Error Handling"
echo ""
echo -e "${GREEN}Access Dashboard:${NC}"
echo "  1. Start API: npm run api"
echo "  2. Open browser: http://localhost:3000"
echo "  3. Interact with dashboard"
echo ""
echo -e "${GREEN}To Run API & Dashboard:${NC}"
echo "  npm run api"
echo ""
echo -e "${GREEN}Production Mode:${NC}"
echo "  npm run build && npm start"
echo ""
echo -e "${GREEN}Available Algorithms:${NC}"
echo "  ✓ Genetic Algorithm"
echo "  ✓ Particle Swarm Optimizer"
echo "  ✓ Simulated Annealing"
echo "  ✓ Ant Colony Optimization"
echo "  ✓ Differential Evolution"
echo "  ✓ Harmony Search"
echo "  ✓ Tabu Search"
echo ""
echo "Repository: $(git remote get-url origin)"
echo "Branch: $(git rev-parse --abbrev-ref HEAD)"
echo ""
echo "Status: READY FOR PRODUCTION ✓"
echo ""
