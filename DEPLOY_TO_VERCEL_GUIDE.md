# Deploy XIO Dashboard to Vercel - Web Dashboard Guide

## Step-by-Step Instructions

### Step 1: Open Vercel Dashboard
- Go to: **https://vercel.com/dashboard**
- Make sure you're logged in (sign up if needed)

### Step 2: Import Project
- Click **"Add New..."** button (top right)
- Select **"Project"**

### Step 3: Select Repository
- You should see a list of GitHub repositories
- Search for: **`xio-agents-2b`**
- Click on it to select

### Step 4: Import Repository
- Click the **"Import"** button
- Wait a few seconds for Vercel to scan the repository

### Step 5: Configure Project Settings

**Framework Preset**:
- Framework: **Next.js** (should be auto-detected ✓)

**Root Directory** (IMPORTANT):
- Click in the "Root Directory" field
- Clear any existing value
- Enter: **`xio-dashboard`**
- This tells Vercel to deploy the dashboard, not the main project

**Build Command**:
- Should show: `next build` (default ✓)
- Leave as is

**Output Directory**:
- Should show: `.next` (default ✓)
- Leave as is

### Step 6: Environment Variables (Skip)
- No environment variables needed for now
- Click "Deploy" to continue

### Step 7: Deploy
- Click the large **"Deploy"** button
- A build screen will appear showing:
  ```
  Building...
  Installing dependencies...
  Running build...
  ```

### Step 8: Wait for Completion
- Build typically takes **2-3 minutes**
- Watch the progress screen
- You'll see:
  - ✓ Installing dependencies
  - ✓ Running build
  - ✓ Deployment complete

### Step 9: Get Your Live URL
Once deployment completes:
- Click **"Visit"** button
- Your dashboard opens in new tab!
- Copy the URL (looks like): `https://xio-dashboard-abc123def.vercel.app`

### Step 10: Share Your Dashboard
Your live dashboard includes:
- ✅ 5 scalability performance charts
- ✅ 4 KPI cards showing system metrics
- ✅ Resource utilization tracking
- ✅ Database performance visualization
- ✅ Federated learning training metrics
- ✅ Fully responsive design

---

## What Happens Next

### Auto-Deployment on Git Push
Every time you push to GitHub:
```bash
git push origin main
```

Vercel automatically:
1. Detects the new commit
2. Builds the project
3. Deploys to production
4. Updates your live URL (same link, new version)

### Accessing Deployments
- Click **"Deployments"** tab in Vercel
- See history of all builds
- Rollback to previous version if needed
- View build logs

### Monitoring
- **Analytics**: See traffic and performance
- **Logs**: Check for errors
- **Settings**: Configure domain, environment variables, etc.

---

## Troubleshooting

### Build Fails
**Signs**: Red error message during build
**Solution**:
1. Check error message in Vercel logs
2. Fix issue locally
3. Run `npm run build` to test
4. Push fix to GitHub
5. Vercel rebuilds automatically

### Deployment Stuck
**Signs**: "Building..." for more than 5 minutes
**Solution**:
1. Click "Redeploy" button
2. Or wait a bit longer (sometimes normal)

### Site Shows Blank
**Signs**: Deployed but page is empty
**Solution**:
1. Open browser console (F12)
2. Check for errors
3. Check Vercel build logs
4. Ensure root directory is `xio-dashboard`

### Custom Domain (Optional Later)
To add your own domain:
1. Settings → Domains
2. Enter your domain
3. Point DNS to Vercel
4. Verify

---

## Your Deployment URL

After deployment, your dashboard will be at:
```
https://xio-dashboard-[random-id].vercel.app
```

Example:
```
https://xio-dashboard-8s9d7h.vercel.app
```

This URL is:
- ✅ Publicly accessible
- ✅ Secure (HTTPS)
- ✅ No VPN needed
- ✅ Shareable with anyone

---

## What's Deployed

Your Vercel deployment includes:

**Home Section**:
- XIO Dashboard title
- 3 KPI cards (Cases, Resolutions, Team)
- Original charts (Sensitivity, Temporal, Executive Index)

**Scalability Metrics Section** (NEW):
- 4 KPI cards:
  - Max Clientes: 500+
  - Throughput: 180K ops/sec
  - Latencia: 45ms
  - DB Capacity: 1TB

- 5 Performance Charts:
  1. Throughput vs Clientes (area chart)
  2. Latencia vs Clientes (line chart)
  3. Database Performance (composite chart)
  4. Resource Utilization (stacked area)
  5. Training Time (multi-line chart)

**Data Section**:
- Original cases table

---

## Timeline

- **Time to Deploy**: 5-10 minutes total
- **Build Time**: 2-3 minutes
- **After First Deploy**: Subsequent deploys are faster (~2 minutes)

---

## Next Steps After Deployment

1. ✅ Visit live URL
2. ✅ Test all scalability charts
3. ✅ Share with team/stakeholders
4. ✅ Get feedback
5. Optional: Connect to live API later

---

## Support

If you get stuck:
1. Check error message in Vercel logs
2. Verify root directory is `xio-dashboard`
3. Run `npm run build` locally to test
4. Check GitHub to confirm code is pushed

---

## Key Details to Remember

- **Root Directory**: `xio-dashboard` (not the project root!)
- **Framework**: Next.js (auto-detected)
- **Environment Variables**: None needed initially
- **Build Command**: `next build`
- **Output Directory**: `.next`

---

**Ready to deploy? Go to https://vercel.com/dashboard and follow steps 1-9 above!**

Your scalability dashboard will be live in minutes! 🚀
