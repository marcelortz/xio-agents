#!/bin/bash

BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
PURPLE='\033[0;35m'
NC='\033[0m'

echo -e "${PURPLE}
╔════════════════════════════════════════════════════════════╗
║  🚀 RAILWAY DEPLOYMENT                                    ║
║  XIO Agents - Cloud Infrastructure Deployment             ║
╚════════════════════════════════════════════════════════════╝
${NC}"

# ════════════════════════════════════════════════════════════
# STEP 1: Pre-deployment verification
# ════════════════════════════════════════════════════════════

echo -e "\n${YELLOW}[STEP 1] Pre-Deployment Verification${NC}"
echo "─────────────────────────────────────────"

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo -e "${RED}❌ Railway CLI not found${NC}"
    echo "Install Railway CLI: npm install -g @railway/cli"
    exit 1
fi

echo -e "${GREEN}✅ Railway CLI installed${NC}"

# Check Railway login status
if ! railway whoami > /dev/null 2>&1; then
    echo -e "${RED}❌ Not logged in to Railway${NC}"
    echo "Run: railway login"
    exit 1
fi

echo -e "${GREEN}✅ Railway authenticated${NC}"

# Verify git status is clean
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${RED}❌ Uncommitted changes found${NC}"
    echo "Please commit or stash changes before deployment"
    exit 1
fi

echo -e "${GREEN}✅ Git repository clean${NC}"

# Verify git remote exists
if ! git remote get-url origin > /dev/null 2>&1; then
    echo -e "${RED}❌ Git remote 'origin' not found${NC}"
    exit 1
fi

REMOTE_URL=$(git remote get-url origin)
echo -e "${GREEN}✅ Git remote configured: ${REMOTE_URL}${NC}"

# Verify required files exist
REQUIRED_FILES=("package.json" "tsconfig.json")
for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${RED}❌ Required file missing: $file${NC}"
        exit 1
    fi
done

echo -e "${GREEN}✅ All required files present${NC}"

# ════════════════════════════════════════════════════════════
# STEP 2: Setup Railway configuration
# ════════════════════════════════════════════════════════════

echo -e "\n${YELLOW}[STEP 2] Railway Configuration Setup${NC}"
echo "─────────────────────────────────────────"

# Check if railway.json exists
if [ ! -f "railway.json" ]; then
    echo -e "${YELLOW}⚠️  railway.json not found, creating...${NC}"
    cat > railway.json << 'EOF'
{
  "name": "xio-agents",
  "description": "XIO Agents - Corporate Governance & Digital Signature System",
  "runtime": "node",
  "buildCommand": "npm install && npm run build",
  "startCommand": "npm start",
  "environment": {
    "NODE_ENV": "production",
    "PORT": "3001"
  }
}
EOF
    echo -e "${GREEN}✅ railway.json created${NC}"
else
    echo -e "${GREEN}✅ railway.json exists${NC}"
fi

# Check if Procfile exists (optional but recommended)
if [ ! -f "Procfile" ]; then
    echo -e "${YELLOW}⚠️  Procfile not found, creating...${NC}"
    cat > Procfile << 'EOF'
web: npm start
EOF
    echo -e "${GREEN}✅ Procfile created${NC}"
else
    echo -e "${GREEN}✅ Procfile exists${NC}"
fi

# ════════════════════════════════════════════════════════════
# STEP 3: Build verification
# ════════════════════════════════════════════════════════════

echo -e "\n${YELLOW}[STEP 3] Local Build Verification${NC}"
echo "─────────────────────────────────────────"

echo "Building TypeScript..."
npm run build > /dev/null 2>&1

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed${NC}"
    echo "Fix build errors before deploying"
    exit 1
fi

echo -e "${GREEN}✅ TypeScript compiled successfully${NC}"

# ════════════════════════════════════════════════════════════
# STEP 4: Dependency check
# ════════════════════════════════════════════════════════════

echo -e "\n${YELLOW}[STEP 4] Dependency Verification${NC}"
echo "─────────────────────────────────────────"

npm audit --production 2>/dev/null

if [ $? -eq 1 ]; then
    echo -e "${YELLOW}⚠️  Security vulnerabilities detected${NC}"
    echo "Run: npm audit fix"
    read -p "Continue deployment anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo -e "${GREEN}✅ No security vulnerabilities${NC}"
fi

# ════════════════════════════════════════════════════════════
# STEP 5: Environment setup
# ════════════════════════════════════════════════════════════

echo -e "\n${YELLOW}[STEP 5] Environment Setup${NC}"
echo "─────────────────────────────────────────"

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo -e "${YELLOW}⚠️  .env.production not found${NC}"
    echo "Creating template .env.production..."
    cat > .env.production << 'EOF'
NODE_ENV=production
PORT=3001
LOG_LEVEL=info
DATABASE_URL=
API_KEY=
JWT_SECRET=
EOF
    echo -e "${YELLOW}⚠️  Please configure .env.production before deploying${NC}"
    echo "Required variables:"
    echo "  - DATABASE_URL: Your production database URL"
    echo "  - API_KEY: Production API key"
    echo "  - JWT_SECRET: JWT signing secret"
    read -p "Continue deployment? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo -e "${GREEN}✅ .env.production configured${NC}"
fi

# ════════════════════════════════════════════════════════════
# STEP 6: Get or create Railway project
# ════════════════════════════════════════════════════════════

echo -e "\n${YELLOW}[STEP 6] Railway Project Setup${NC}"
echo "─────────────────────────────────────────"

# Check if linked to a Railway project
if [ -f ".railway/config" ] || [ -f ".railway/service" ]; then
    echo -e "${GREEN}✅ Railway project already linked${NC}"
else
    echo -e "${YELLOW}📍 Linking to Railway project...${NC}"
    railway init --yes
    if [ $? -ne 0 ]; then
        echo -e "${YELLOW}⚠️  Could not auto-init Railway project${NC}"
        echo "Run 'railway init' manually or create project at https://railway.app"
    fi
fi

# ════════════════════════════════════════════════════════════
# STEP 7: Deploy to Railway
# ════════════════════════════════════════════════════════════

echo -e "\n${YELLOW}[STEP 7] Deploy to Railway${NC}"
echo "─────────────────────────────────────────"

echo -e "${BLUE}Starting Railway deployment...${NC}"
railway up

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Railway deployment failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Deployment pushed to Railway${NC}"

# ════════════════════════════════════════════════════════════
# STEP 8: Post-deployment status
# ════════════════════════════════════════════════════════════

echo -e "\n${YELLOW}[STEP 8] Deployment Status${NC}"
echo "─────────────────────────────────────────"

# Get Railway service info
railway status

echo -e "${GREEN}✅ Railway deployment completed${NC}"

# ════════════════════════════════════════════════════════════
# STEP 9: Final deployment summary
# ════════════════════════════════════════════════════════════

echo -e "\n${PURPLE}
╔════════════════════════════════════════════════════════════╗
║  ✅ RAILWAY DEPLOYMENT COMPLETE                           ║
╚════════════════════════════════════════════════════════════╝
${NC}"

echo -e "${GREEN}📊 DEPLOYMENT INFORMATION:${NC}
─────────────────────────────────────────────────────────────
🚀 Platform: Railway (https://railway.app)
📦 Repository: ${REMOTE_URL}
🔧 Environment: Production
📝 Build Command: npm install && npm run build
▶️  Start Command: npm start
🔐 Environment Variables: Configure via Railway Dashboard

${GREEN}✅ NEXT STEPS:${NC}
  1. View deployment dashboard: railway dashboard
  2. Monitor logs: railway logs
  3. Check service status: railway status
  4. Add environment variables: railway variables
  5. Configure domain: Railway Dashboard → Settings
  6. Set up monitoring: Railway Dashboard → Monitoring
  7. Configure auto-deployment: Railway Dashboard → Settings

${YELLOW}📋 USEFUL COMMANDS:${NC}
  • View logs: railway logs -f
  • Restart service: railway restart
  • Shell into container: railway shell
  • View variables: railway variables
  • Open dashboard: railway open

${YELLOW}🔗 DEPLOYMENT URLS:${NC}"

# Try to get the deployment URL
DEPLOY_URL=$(railway status 2>/dev/null | grep -i "url\|domain" | head -1)
if [ -n "$DEPLOY_URL" ]; then
    echo "  $DEPLOY_URL"
else
    echo "  View in Railway Dashboard: https://railway.app"
fi

echo -e "
${YELLOW}⚠️  IMPORTANT REMINDERS:${NC}
  • Monitor logs for errors: railway logs -f
  • Set up automated backups
  • Configure health check endpoints
  • Enable auto-restart on failure
  • Set up alerting for anomalies
  • Document deployment procedures
  • Test disaster recovery plan

${GREEN}─────────────────────────────────────────────────────────────
✅ DEPLOYMENT TO RAILWAY COMPLETE - Ready for Use
${NC}"
