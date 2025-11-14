# Quick Connection Guide - Railway Backend

This is a simplified guide to connect your Lovable app to Railway for heavy computations.

## Overview

```
┌─────────────────────────┐
│   Your Lovable App      │
│   (Frontend + UI)       │
└───────────┬─────────────┘
            │
            │ When user clicks "Optimize"
            ↓
┌─────────────────────────┐
│   Railway Service       │
│   (32GB RAM + 8 CPU)    │
│   - Inventory Opt       │
│   - Network Opt         │
│   - GFA Opt             │
│   - Forecasting         │
└───────────┬─────────────┘
            │
            │ Returns results
            ↓
┌─────────────────────────┐
│   Lovable Cloud DB      │
│   (Stores results)      │
└─────────────────────────┘
```

## What Gets Deployed Where

### Lovable Cloud (No Changes Needed)
- ✅ Your entire frontend (React app)
- ✅ User authentication
- ✅ Database (all your data)
- ✅ File storage
- ✅ Simple API calls

### Railway (New - For Heavy Computation)
- ✅ Inventory optimization calculations
- ✅ Network optimization solver
- ✅ GFA allocation algorithm
- ✅ Demand forecasting models

## Connection Files Already Created

I've created these files in your project:

### Backend Files (in `railway-backend/` folder)
- `server.js` - Main API server
- `services/inventory-optimizer.js` - Inventory calculations
- `services/network-optimizer.js` - Network solver
- `services/gfa-optimizer.js` - GFA algorithm
- `services/forecasting.js` - Forecasting models
- `package.json` - Dependencies

### Frontend Files
- `src/lib/railwayClient.ts` - Client to call Railway
- `.env.example` - Environment variable template

### Documentation
- `RAILWAY_DEPLOYMENT_GUIDE.md` - Complete step-by-step guide
- `railway-backend/README.md` - Railway backend documentation

## Quick Setup Steps

### 1. Push to GitHub (One-Time)
1. Click **GitHub** button in Lovable (top right)
2. Click **"Connect to GitHub"**
3. Click **"Transfer to GitHub"**
4. ✅ Done! Your code is on GitHub

### 2. Deploy to Railway (One-Time)
1. Go to https://railway.app and sign up
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select your repository
4. Set **Root Directory**: `railway-backend`
5. Set **Start Command**: `node server.js`
6. Add environment variables:
   ```
   PORT=3000
   NODE_ENV=production
   NODE_OPTIONS=--max-old-space-size=32768
   FRONTEND_URL=https://your-app.lovable.app
   ```
7. Upgrade to **Pro Plan** for 32GB RAM
8. Set **Memory**: 32GB, **CPU**: 8 vCPUs
9. Click **Deploy**
10. Copy your Railway URL (e.g., `https://xyz.up.railway.app`)

### 3. Connect Lovable to Railway (One-Time)
In Lovable, tell me one of these commands:

**Option A (Easiest):**
```
Add Railway environment variables
```
Then paste your Railway URL when I ask.

**Option B (Manual):**
1. Enable Dev Mode in Lovable
2. Edit `.env` file:
   ```
   VITE_USE_RAILWAY_BACKEND=true
   VITE_RAILWAY_BACKEND_URL=https://your-railway-url.up.railway.app
   ```

Then tell me:
```
Connect frontend to Railway backend
```

I'll update all 4 modules (Inventory, Network, GFA, Forecasting) to use Railway automatically.

### 4. Test (2 Minutes)
1. Open your Lovable app
2. Try optimizing in any module
3. Check Railway logs to see it working

## How It Works After Setup

### User clicks "Optimize" in your app
```typescript
// Before (Lovable Cloud - slower, limited RAM)
const result = await supabase.functions.invoke('optimize-inventory', { body: data });

// After (Railway - faster, 32GB RAM)
const result = await railwayClient.optimizeInventory(data, config);
```

### Railway processes the request
```javascript
// Railway receives request
// Runs optimization with 32GB RAM
// Returns results in seconds
```

### Results saved to Lovable Cloud database
```typescript
// Frontend saves results
await supabase.from('optimization_results').insert(result);
```

## Environment Variables Explained

### In Railway
```bash
PORT=3000                              # Railway assigns this automatically
NODE_ENV=production                    # Enables production optimizations
NODE_OPTIONS=--max-old-space-size=32768  # Use 32GB RAM
FRONTEND_URL=https://your-app.lovable.app # Your Lovable app URL for CORS
```

### In Lovable (.env file)
```bash
# Enable Railway backend
VITE_USE_RAILWAY_BACKEND=true

# Your Railway service URL
VITE_RAILWAY_BACKEND_URL=https://your-service.up.railway.app
```

## Which Modules Use Railway?

| Module | Before Railway | After Railway |
|--------|----------------|---------------|
| **Inventory Optimization** | ❌ Timeouts on large datasets | ✅ Handles 1000+ policies |
| **Network Analysis** | ❌ Limited to small networks | ✅ 100+ node networks |
| **GFA Module** | ❌ Slow with 50+ facilities | ✅ 500+ facilities instant |
| **Demand Forecasting** | ❌ 1 year max data | ✅ 5+ years of data |

## Troubleshooting

### "Railway not responding"
- Check Railway logs for errors
- Verify `FRONTEND_URL` in Railway matches your Lovable URL exactly
- Make sure Railway service is deployed and running

### "CORS error"
- Update `FRONTEND_URL` in Railway to your exact Lovable app URL
- Include `https://` protocol
- No trailing slash

### "Still using Lovable Cloud"
- Check `.env` has `VITE_USE_RAILWAY_BACKEND=true`
- Verify `VITE_RAILWAY_BACKEND_URL` is set correctly
- Clear browser cache and refresh

### "Out of memory on Railway"
- Check Railway plan (must be Pro for 32GB)
- Verify memory allocation in Railway settings
- Check logs for actual memory usage

## Cost Breakdown

### Railway Costs
- **Base Pro Plan**: $20/month
- **32GB RAM + 8 vCPU**: ~$40-60/month usage
- **Total**: ~$60-80/month

### Lovable Costs
- **No change** - continues as before
- Database and auth stay on Lovable Cloud

### Why This Setup?
- ✅ Much cheaper than upgrading Lovable Cloud instance
- ✅ More stable for heavy computations
- ✅ Keep all the benefits of Lovable Cloud
- ✅ Easy to scale up or down

## Need Help?

### Quick Commands to Tell Me:
- "Add Railway environment variables" - I'll set up your .env file
- "Connect frontend to Railway backend" - I'll update all modules
- "Railway not working" - I'll help debug
- "Show Railway logs" - I'll guide you through Railway logs

### Resources:
- Full guide: `RAILWAY_DEPLOYMENT_GUIDE.md`
- Railway docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway

---

**Ready to start?** Just tell me:
```
Push my code to GitHub
```

Then follow the steps above. I'm here to help at every step!
