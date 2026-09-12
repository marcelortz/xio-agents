# Vercel Deployment Guide - React Dashboard

Complete guide to deploy the Federated Learning React Dashboard to Vercel.

## ✅ Prerequisites

- GitHub account with this repository
- Vercel account (free at https://vercel.com)
- Local API server running (for development testing)

## 🚀 Deployment Steps

### Step 1: Prepare for Deployment

The project is already configured for Vercel. Key files:

- `vercel.json` - Vercel configuration
- `.env.local` - Local development environment
- `src/components/App.tsx` - Uses environment variables for API URL

### Step 2: Connect GitHub to Vercel

1. Go to https://vercel.com
2. Click "New Project"
3. Import the GitHub repository:
   - Select: `marcelortz/xio-agents-2b`
   - Click "Import"

### Step 3: Configure Environment Variables

In Vercel project settings:

1. Go to Settings → Environment Variables
2. Add the following variables:

**For Production:**
```
REACT_APP_API_URL = https://your-api-server.com/federated
```

**For Preview/Development:**
```
REACT_APP_API_URL = http://localhost:3000/federated
```

### Step 4: Deploy

1. Click "Deploy"
2. Wait for build to complete (~2-3 minutes)
3. Get your live URL (e.g., `https://your-project-name.vercel.app`)

## 📋 Configuration

### Environment Variables

The app uses these environment variables:

| Variable | Purpose | Example |
|----------|---------|---------|
| `REACT_APP_API_URL` | API base URL | `http://localhost:3000/federated` |

### Build Configuration

Vercel automatically detects:
- Build command: `npm run build`
- Framework: React (auto-detected)
- Output directory: Default (build/)

## 🔗 Connecting to Local API

### Option 1: Local Development (Recommended)

Keep API running locally:
```bash
npm run api
# Runs on http://localhost:3000
```

Visit locally deployed dashboard:
```bash
npm start
# React dev server on http://localhost:3000
```

### Option 2: Production API Server

When API is deployed to production:

1. Set environment variable:
   ```
   REACT_APP_API_URL = https://your-api-domain.com/federated
   ```

2. Redeploy to Vercel:
   ```bash
   git push origin main  # Automatic deployment
   ```

## 🧪 Testing Deployment

### Test Local Development
```bash
# Terminal 1: Start API
npm run api

# Terminal 2: Start React dev server
npm start

# Visit http://localhost:3000
```

### Test Production Build
```bash
# Build for production
npm run build

# Serve production build locally
npm install -g serve
serve -s build -l 3001

# Visit http://localhost:3001
```

## 🛠️ Troubleshooting

### API Connection Error

**Problem:** Dashboard shows "API connection failed"

**Solution:**
1. Verify API is running: `curl http://localhost:3000/federated/info`
2. Check environment variable: `REACT_APP_API_URL`
3. Ensure CORS is enabled on API server

### Build Fails

**Problem:** Vercel build fails with TypeScript errors

**Solution:**
1. Check that `tsconfig.json` is present
2. Run locally: `npm run build`
3. Fix any TypeScript errors
4. Push to GitHub - Vercel will rebuild

### Blank Page or 404

**Problem:** Dashboard shows blank or 404 error

**Solution:**
1. Check Vercel build logs
2. Verify `vercel.json` configuration
3. Clear cache and redeploy: Settings → Deployments → Redeploy

## 📊 Deployment Checklist

- [ ] GitHub repository is public
- [ ] Vercel account created
- [ ] Repository imported to Vercel
- [ ] Environment variables configured
- [ ] Build succeeds in Vercel
- [ ] Dashboard loads at Vercel URL
- [ ] Can connect to local API
- [ ] Can create sessions
- [ ] Can add clients
- [ ] Can run training

## 🔒 Security Considerations

### For Production:

1. **Update API URL** to production server
2. **Add authentication** to API if needed
3. **Enable HTTPS** (automatic with Vercel)
4. **Set CORS properly** to allow Vercel domain
5. **Add rate limiting** to API
6. **Use environment secrets** for sensitive data

### Vercel Security Features (Automatic):

- ✅ HTTPS/SSL encryption
- ✅ DDoS protection
- ✅ Automatic deployments
- ✅ Preview URLs for PRs
- ✅ Git-based deployments

## 📈 Monitoring & Analytics

### Vercel Dashboard Shows:

- Deployment history
- Build logs
- Performance metrics
- Function usage
- Error tracking

### Add Custom Monitoring:

```typescript
// Add performance tracking
console.time('API Call');
const result = await client.train(sessionId, {...});
console.timeEnd('API Call');
```

## 🔄 Continuous Deployment

### Automatic Deployments:

Every push to `main` branch automatically:
1. Triggers Vercel build
2. Runs tests (if configured)
3. Builds React app
4. Deploys to production
5. Updates live URL

### Preview Deployments:

Every pull request automatically gets:
1. Unique preview URL
2. Full copy of production environment
3. Comment with preview link on PR

## 📱 Testing on Mobile

Vercel URL works on all devices:

1. Share Vercel URL: `https://your-project.vercel.app`
2. Open on mobile browser
3. Test responsive design
4. Test touch interactions

## 🚀 Next Steps

### When API is Ready for Production:

1. Deploy API server to production
2. Update `REACT_APP_API_URL` in Vercel
3. Test integration
4. Monitor performance

### Optional Enhancements:

1. Add authentication to dashboard
2. Add database persistence
3. Add monitoring/logging
4. Setup custom domain
5. Configure analytics

## 📞 Support & Troubleshooting

### Vercel Documentation:
- https://vercel.com/docs
- https://vercel.com/docs/concepts/deployments/overview

### React Deployment:
- https://create-react-app.dev/deployment/vercel/

### Common Issues:
- Environment variables not working: Clear cache, redeploy
- API connection fails: Check CORS on API server
- Build fails: Run `npm run build` locally to debug

## 🎯 Quick Reference

### Deploy to Vercel:
```bash
# 1. Push to GitHub
git push origin main

# 2. Vercel auto-deploys
# Check status at https://vercel.com/dashboard

# 3. Get live URL
# Visit: https://your-project-name.vercel.app
```

### Update Environment Variable:
```
Settings → Environment Variables → Add/Edit → Redeploy
```

### View Logs:
```
Deployments → Select Deployment → Build Logs / Runtime Logs
```

### Rollback:
```
Deployments → Select Previous → Redeploy
```

---

**Status:** Ready to deploy  
**Estimated Deploy Time:** 2-3 minutes  
**Cost:** Free tier available (up to 100 deployments/month)
