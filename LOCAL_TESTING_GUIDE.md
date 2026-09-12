# Local Testing Guide - Federated Learning Dashboard

Complete guide to test the React Dashboard locally before Vercel deployment.

## 📋 Prerequisites

- Node.js 18+ installed
- npm or yarn
- Git (already done)
- Two terminal tabs/windows

---

## 🚀 Step 1: Start the Backend API

### Terminal 1 - API Server

```bash
# Ensure you're in the project root
cd ~/ml-optimization-suite  # or your project path

# Install dependencies (if not already done)
npm install

# Start the API server
npm run api
```

**Expected Output:**
```
> ml-optimization-suite@1.0.0 api
> ts-node src/api/server.ts

ML Optimization Suite API running on http://localhost:3000
Health check: http://localhost:3000/health
API docs: http://localhost:3000/api/info
```

**Verify API is working:**
```bash
# In another terminal, test the API
curl http://localhost:3000/federated/info

# Expected: JSON response with API information
```

---

## 📱 Step 2: Create React Dev Environment

Since we have React components but no dev server yet, we have two options:

### Option A: Quick Test with Create React App (Recommended)

```bash
# Terminal 2 - Create a temporary React app for testing
cd ~/tmp  # or any working directory
npx create-react-app federated-dashboard-test

cd federated-dashboard-test

# Copy our dashboard component
cp ~/ml-optimization-suite/src/components/FederatedLearningDashboard.tsx src/
cp ~/ml-optimization-suite/src/components/App.tsx src/
cp ~/ml-optimization-suite/src/api/federated-learning-client.ts src/api/

# Create the api directory if it doesn't exist
mkdir -p src/api

# Install any needed dependencies (already in CRA)

# Start the dev server
npm start
```

**Expected Output:**
```
Compiled successfully!

You can now view federated-dashboard-test in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://[your-ip]:3000
```

### Option B: Manual Setup with Vite (Faster)

```bash
npm create vite@latest federated-dashboard-test -- --template react-ts

cd federated-dashboard-test
npm install
npm run dev
```

---

## ✅ Step 3: Test the Dashboard

### Open in Browser

1. Go to: `http://localhost:3000`
2. You should see the Federated Learning Dashboard

### Test Checklist

**UI Loads:**
- [ ] Dashboard title visible
- [ ] "Create New Session" card displayed
- [ ] "Active Sessions" card displayed
- [ ] No console errors

**Create Session:**
- [ ] Click "Create Session"
- [ ] Select aggregation strategy (default: averaging)
- [ ] Button shows "Creating..."
- [ ] Success alert appears
- [ ] New session appears in list

**Add Client:**
- [ ] Select the session from list
- [ ] "Add Client" form appears
- [ ] Fill in client ID: "test-client-1"
- [ ] Set features: 10
- [ ] Set samples: 20
- [ ] Click "Add Client"
- [ ] Success message appears
- [ ] Metrics update

**Add More Clients:**
- [ ] Click "Add Client" again
- [ ] Create 2 more clients (test-client-2, test-client-3)
- [ ] Verify client count increases to 3

**Run Training:**
- [ ] Set rounds: 5
- [ ] Set epochs: 2
- [ ] Click "Start Training"
- [ ] Button shows "Training..."
- [ ] Wait for completion
- [ ] Success message appears
- [ ] Training rounds counter updates
- [ ] Model weights display updates

**View Metrics:**
- [ ] Clients metric shows 3
- [ ] Training rounds shows 5
- [ ] Model weights preview shows numbers

**Delete Session:**
- [ ] Click delete button on session
- [ ] Confirm deletion
- [ ] Session disappears from list

---

## 🧪 Detailed Test Scenarios

### Scenario 1: Complete Workflow

```
1. Create Session
   ↓
2. Add 3 Clients
   ↓
3. Run Training (5 rounds, 2 epochs)
   ↓
4. View Results
   ↓
5. Check Metrics
   ↓
6. Delete Session
```

**Expected Results:**
- All operations succeed without errors
- Real-time updates visible
- Metrics reflect operations
- No console errors or warnings

### Scenario 2: Error Handling

Test the error handling:

```bash
# Stop the API server (Ctrl+C in Terminal 1)

# In dashboard, try to:
1. Create Session
   → Should show error: "Failed to create session"
   
2. Reload page
   → Should show error loading sessions

# Restart API server
npm run api

# Retry operations
→ Should work again
```

### Scenario 3: Multiple Sessions

```
1. Create Session A (strategy: averaging)
2. Create Session B (strategy: median)
3. Add clients to Session A
4. Add different clients to Session B
5. Train Session A
6. Train Session B
7. Compare results
```

---

## 🔧 Troubleshooting Local Testing

### Issue: "Cannot find module" errors

**Solution:**
```bash
# Ensure all dependencies are installed
npm install

# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Issue: API Connection Refused

**Solution:**
```bash
# Verify API is running on port 3000
curl http://localhost:3000/health

# If not running, start it
npm run api

# Check if port 3000 is already in use
# Try different port by editing App.tsx
```

### Issue: Dashboard shows blank page

**Solution:**
```bash
# Check browser console for errors (F12)
# Clear cache: Ctrl+Shift+Delete
# Restart dev server: Ctrl+C then npm start
```

### Issue: TypeScript errors

**Solution:**
```bash
# The components are TypeScript (.tsx files)
# Ensure project supports JSX/TSX

# For Create React App (automatic)
# For Vite, ensure React plugin is installed:
npm install @vitejs/plugin-react
```

---

## 📊 Expected Performance

### Response Times:
- Create Session: <100ms
- Add Client: <50ms
- Start Training: ~500ms (actual training is backend)
- View Metrics: <100ms
- Dashboard Load: <1000ms

### No Errors or Warnings:
- Console should be clean
- No red error messages
- No yellow warnings

---

## 🔍 Verification Tests

### API Health Check

```bash
curl http://localhost:3000/federated/info
```

**Expected Response:**
```json
{
  "name": "Federated Learning API",
  "version": "1.0.0",
  "description": "Distributed machine learning framework",
  "endpoints": {
    "sessions": {...},
    "clients": {...},
    "training": {...},
    "strategies": {...}
  }
}
```

### List Sessions via API

```bash
curl http://localhost:3000/federated/sessions
```

**Expected Response:**
```json
{
  "totalSessions": 1,
  "sessions": [{...}]
}
```

### Get Session Details

```bash
curl http://localhost:3000/federated/sessions/session-1-xxx
```

---

## 📝 Testing Checklist

### UI Tests
- [ ] Dashboard loads without errors
- [ ] All cards render properly
- [ ] Forms accept input
- [ ] Buttons are clickable
- [ ] Alerts display correctly

### Functional Tests
- [ ] Create session works
- [ ] Add client works
- [ ] Training starts and completes
- [ ] Metrics update correctly
- [ ] Delete operations work

### Error Handling Tests
- [ ] Invalid input shows errors
- [ ] API down shows error
- [ ] Network errors handled
- [ ] Error messages are clear

### Performance Tests
- [ ] Dashboard loads in <1s
- [ ] Operations respond quickly
- [ ] No memory leaks
- [ ] No console errors

### Cross-Browser Tests
- [ ] Chrome/Chromium ✓
- [ ] Firefox ✓
- [ ] Safari ✓
- [ ] Mobile browser ✓

---

## 🎯 Ready for Vercel?

Once all tests pass:
- [ ] All functionality works locally
- [ ] No console errors
- [ ] API communication verified
- [ ] Error handling tested
- [ ] Performance acceptable

**Then proceed with Vercel deployment!**

---

## 📋 Quick Reference Commands

```bash
# Terminal 1 - API Server
npm run api

# Terminal 2 - React Dashboard (Create React App)
npx create-react-app federated-dashboard-test
cd federated-dashboard-test
npm start

# Terminal 2 - React Dashboard (Vite)
npm create vite@latest federated-dashboard-test -- --template react-ts
cd federated-dashboard-test
npm install
npm run dev

# Test API from command line
curl http://localhost:3000/federated/info
curl http://localhost:3000/federated/sessions
curl http://localhost:3000/health

# Stop servers
# Ctrl+C in either terminal
```

---

## 🚀 Next Steps

After successful local testing:

1. **Fix any issues found**
2. **Document any bugs**
3. **Update code if needed**
4. **Commit changes to GitHub**
5. **Deploy to Vercel**

---

## 💡 Pro Tips

1. **Use browser DevTools** (F12) to inspect network requests
2. **Check API responses** in Network tab to see actual data
3. **Monitor console** for any JavaScript errors
4. **Test with slow network** to see loading states
5. **Test in incognito mode** to avoid cache issues

---

## 📞 Still Having Issues?

Check:
1. Is Node.js 18+ installed? (`node --version`)
2. Is API running? (Check Terminal 1)
3. Is React dev server running? (Check Terminal 2)
4. Are both on correct ports? (API: 3000, React: 3000/3001)
5. Console errors? (F12 → Console tab)

---

**Status: Ready to test locally! 🎉**

Once all tests pass, you're ready to deploy to Vercel.
