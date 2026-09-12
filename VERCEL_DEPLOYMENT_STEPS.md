# Vercel Deployment Guide - Complete Steps

## Prerequisites
- Vercel account (https://vercel.com)
- GitHub account connected to Vercel
- Repository: https://github.com/marcelortz/xio-agents-2b

## Quick Start (Recommended)

### Step 1: Deploy Dashboard to Vercel

**Option A: Via Vercel CLI (Fast)**

```bash
# Install Vercel CLI globally
npm i -g vercel

# In xio-dashboard directory
cd C:\Users\omsor\.claude\xio-dashboard

# Deploy to Vercel
vercel

# Follow prompts:
# - Link to existing project or create new
# - Select "xio-agents-2b" project
# - Confirm deployment settings
```

**Option B: Via Vercel Web Dashboard (Recommended for first time)**

1. Go to https://vercel.com/dashboard
2. Click "Add New..." → "Project"
3. Search and select "xio-agents-2b" repository
4. Click "Import"
5. **Framework**: Auto-detected as Next.js ✓
6. **Project Name**: `xio-dashboard` (optional)
7. **Environment Variables**: None needed for now
8. Click "Deploy"

⏱️ **Deployment Time**: 2-3 minutes

---

### Step 2: Get Vercel URL

Once deployed, you'll receive:
- **Live URL**: `https://xio-dashboard-xxx.vercel.app`
- **GitHub Integration**: Auto-deploys on push to main

---

## Full Deployment (Dashboard + API)

### Step 1: Update Root Directory Structure

The API and Dashboard need to be in separate deployments or properly organized. Currently:
- Main API: `/src/api/` (Node.js/Express)
- Dashboard: `/xio-dashboard/` (Next.js)

### Step 2: Deploy Dashboard

**Same as Quick Start Step 1**

### Step 3: Deploy API (Optional - API stays local for now)

The API is best kept running locally or on a Node.js hosting:
- **Option 1**: Keep running locally (recommended initially)
- **Option 2**: Deploy to Heroku (free tier)
- **Option 3**: Deploy to Railway.app
- **Option 4**: Deploy to Render.com

---

## Step-by-Step: Dashboard Deployment

### Via Web Dashboard (Easiest)

**1. Go to Vercel**
```
https://vercel.com/dashboard
```

**2. Create New Project**
- Click "Add New..." button
- Select "Project"

**3. Import GitHub Repository**
- Search: "xio-agents-2b"
- Click "Import"
- Wait for scan to complete

**4. Configure Project**
- **Project Name**: `xio-dashboard` or `xio-agents-dashboard`
- **Framework**: Next.js (auto-detected)
- **Root Directory**: `xio-dashboard`
- **Build Command**: `next build`
- **Output Directory**: `.next`

**5. Environment Variables**
- Click "Add Environment Variable"
- (None required for now - dashboard uses demo data)

**6. Deploy**
- Click "Deploy"
- Wait 2-3 minutes for build

**7. Visit Live Site**
- Click "Visit" button
- Your dashboard is now live! 🎉

---

## Accessing Deployed Dashboard

After deployment:

**Live URL Format**:
```
https://xio-dashboard-[random].vercel.app
```

**What's Deployed**:
- ✅ Scalability graphics (all 5 charts)
- ✅ KPI cards with metrics
- ✅ Resource utilization data
- ✅ Performance benchmarks
- ✅ Responsive design

**Demo Data Used**:
- All charts use pre-configured data
- No API calls needed initially
- Fully functional standalone

---

## Environment Variables (If needed later)

To connect to live API after deployment:

```
NEXT_PUBLIC_API_URL=https://your-api-domain.com/federated
```

Set in Vercel:
1. Project Settings → Environment Variables
2. Add variable
3. Redeploy

---

## Auto-Deploy Setup

**Git Push to Auto-Deploy**:

1. Push changes to GitHub:
```bash
git add .
git commit -m "Update dashboard"
git push origin main
```

2. Vercel automatically:
   - Detects push to main
   - Runs build
   - Deploys new version
   - Updates live URL

**Takes**: ~2-3 minutes

---

## Connecting API Later

When API is ready for production:

**1. Deploy API**
- Choose: Heroku, Railway, Render, or Vercel Functions

**2. Get API URL**
- Example: `https://xio-api.railway.app/federated`

**3. Update Dashboard**
- Set environment variable in Vercel:
  ```
  NEXT_PUBLIC_API_URL=https://xio-api.railway.app/federated
  ```
- Redeploy dashboard

**4. Test Integration**
- Open dashboard
- API calls now go to production

---

## Vercel CLI Alternative (Advanced)

If you prefer command line:

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Navigate to project
cd C:\Users\omsor\.claude\xio-dashboard

# Deploy
vercel

# For production (main branch)
vercel --prod

# Check deployment status
vercel ls
```

---

## Troubleshooting

### Build Fails
**Check**:
- `npm run build` works locally?
- All dependencies installed? (`npm install`)
- Environment variables set?
- Root directory correct in Vercel?

**Fix**:
1. Run build locally: `npm run build`
2. Fix any errors
3. Push to GitHub
4. Vercel redeploys automatically

### Deployment Takes Too Long
- First deploy slower (fresh build)
- Subsequent deploys cache properly
- Typical: 2-3 minutes

### Site is Blank
- Check browser console (F12)
- Check Vercel logs (Deployments → View)
- Ensure Next.js build succeeded

---

## After Deployment

### Share Live Dashboard
- **URL**: `https://xio-dashboard-xxx.vercel.app`
- **Shareable**: Works on any device
- **No VPN needed**: Publicly accessible
- **HTTPS**: Secure by default

### Monitor Performance
- Vercel Dashboard shows:
  - Build status
  - Deployment history
  - Analytics (if enabled)
  - Error logs

### Rollback
If something breaks:
1. Go to Deployments
2. Select previous version
3. Click "Redeploy"
4. Site reverts in seconds

---

## Cost

**Vercel Free Tier Includes**:
- ✅ 3 free deployments per day
- ✅ Bandwidth: 100GB/month
- ✅ Edge Functions: Limited
- ✅ Custom domain support
- ✅ Git integration
- ✅ SSL/HTTPS free

**Perfect for**: Demo, prototype, MVP

**Upgrade when**: You hit 3+ deployments/day or need more resources

---

## Custom Domain (Optional)

To add custom domain:

1. **Register domain**
   - GoDaddy, Namecheap, Google Domains, etc.

2. **Add to Vercel**
   - Project Settings → Domains
   - Enter your domain
   - Point DNS to Vercel

3. **Verify**
   - Vercel provides DNS records
   - Update DNS at registrar
   - Wait 15-30 minutes

4. **Live**
   - `https://your-domain.com`

---

## Summary

### To Deploy Right Now
1. Go to https://vercel.com/dashboard
2. Click "Add New Project"
3. Select "xio-agents-2b" repo
4. Set Root Directory: `xio-dashboard`
5. Click "Deploy"
6. Wait 2-3 minutes
7. Click "Visit" to see live dashboard

### Result
- ✅ Dashboard live on Vercel
- ✅ Auto-updates on git push
- ✅ Scalability graphics visible
- ✅ Shareable public URL

**Time Required**: 5-10 minutes (first time)

---

## Next Steps

1. ✅ Deploy dashboard to Vercel
2. Get live URL
3. Share with team
4. Get feedback on scalability graphics
5. Optional: Deploy API later

**Status**: Ready to deploy! 🚀
