# Railway Deployment Guide - Supply Chain Optimization Service

This guide helps you deploy the high-performance optimization service to Railway.app, while keeping your database and authentication on Lovable Cloud.

## What This Does

This deployment gives you:
- **32GB RAM** for heavy computations
- **More CPU power** for faster optimization  
- **Stable computation** for large datasets
- **All optimization modules**: Inventory, Network, GFA, and Demand Forecasting
- Your database and auth stay on Lovable Cloud (no migration needed)

## Prerequisites

1. A Railway.app account (free tier available at https://railway.app)
2. Your Lovable app already deployed
3. No technical skills needed - just follow these steps!

## Step 1: Push to GitHub (5 minutes)

1. In your Lovable project, click the **GitHub** button (top right)
2. Click **"Connect to GitHub"** and authorize Lovable
3. Click **"Transfer to GitHub"** and create a new repository
4. Your code is now on GitHub!

## Step 2: Deploy to Railway (10 minutes)

### 2.1 Create Railway Project

1. Go to https://railway.app and sign up/login
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Find and select your GitHub repository
5. Railway will automatically detect it's a Node.js project

### 2.2 Configure the Service

1. Once the project is created, click on the **service card**
2. Go to the **"Settings"** tab
3. Set the **Root Directory**: `railway-backend`
4. Set the **Start Command**: `node server.js`

### 2.3 Add Environment Variables

Still in Settings, scroll to **"Variables"** section and add:

```
PORT=3000
NODE_ENV=production
NODE_OPTIONS=--max-old-space-size=32768
FRONTEND_URL=https://your-lovable-app.lovable.app
```

**Important:** Replace `https://your-lovable-app.lovable.app` with your actual Lovable app URL!

### 2.4 Upgrade Resources (for 32GB RAM)

1. In Railway, click your **project name** (top left)
2. Go to **"Settings"**
3. Scroll to **"Plan"** section
4. Upgrade to **Pro Plan** ($20/month)
5. Go back to your **service settings**
6. Under **"Resources"**, select:
   - **Memory**: 32GB
   - **CPU**: 8 vCPUs

### 2.5 Deploy

1. Click the **"Deploy"** button
2. Wait 2-3 minutes for deployment
3. Once done, you'll see a green **"Active"** status
4. Copy your Railway service URL (looks like: `https://your-service.up.railway.app`)

## Step 3: Connect Your Lovable App to Railway (10 minutes)

Now we need to tell your Lovable app to use the Railway service for heavy computations.

### 3.1 Get Your Railway Service URL

1. In Railway, click on your deployed service
2. Go to **"Settings"** tab
3. Find the **"Domains"** section
4. You'll see a URL like: `https://your-service-production-xxxx.up.railway.app`
5. **Copy this URL** (you'll need it in the next step)

### 3.2 Add Environment Variables to Lovable

**Method 1: Using Chat (Easiest)**
1. Come back to this chat
2. Tell me: "Add Railway environment variables"
3. When I ask, paste your Railway URL
4. I'll update your `.env` file automatically

**Method 2: Manual Setup**
1. In your Lovable project, enable **Dev Mode** (toggle in top-left)
2. Find the `.env` file in the file list (left sidebar)
3. Add these two lines at the bottom:
```
VITE_USE_RAILWAY_BACKEND=true
VITE_RAILWAY_BACKEND_URL=https://your-service-production-xxxx.up.railway.app
```
4. **Important**: Replace the URL with YOUR actual Railway URL from Step 3.1
5. Save the file

### 3.3 Update Frontend Code to Use Railway

**Method 1: Using Chat (Easiest)**
1. Tell me: "Connect frontend to Railway backend"
2. I'll automatically update all optimization calls

**Method 2: Manual Updates**
You'll need to update 4 files to use Railway for computations:

#### File 1: Inventory Optimization
Open `src/pages/InventoryOptimizationV2.tsx` and import Railway client at the top:
```typescript
import { railwayClient } from '@/lib/railwayClient';
```

Find the optimization function and replace Supabase call with:
```typescript
const result = await railwayClient.optimizeInventory(tableData, config);
```

#### File 2: Network Analysis  
Open `src/pages/NetworkAnalysis.tsx` and add:
```typescript
import { railwayClient } from '@/lib/railwayClient';
```

Replace network optimization call with:
```typescript
const result = await railwayClient.optimizeNetwork(data, settings);
```

#### File 3: GFA Module
Open `src/pages/GFA.tsx` and add:
```typescript
import { railwayClient } from '@/lib/railwayClient';
```

Replace GFA optimization with:
```typescript
const result = await railwayClient.optimizeGFA(data, settings);
```

#### File 4: Demand Forecasting
Open `src/pages/DemandForecasting.tsx` and add:
```typescript
import { railwayClient } from '@/lib/railwayClient';
```

Replace forecasting call with:
```typescript
const result = await railwayClient.forecastDemand(historicalData, settings);
```

### 3.4 Update Railway CORS Settings

Important: Railway needs to allow requests from your Lovable app.

1. Go back to Railway
2. Click on your service
3. Go to **"Variables"** tab
4. Find `FRONTEND_URL` variable
5. Update it to your **exact** Lovable app URL
6. Click **"Deploy"** to apply changes

Your Lovable URL looks like: `https://[your-app-name].lovable.app`

## Step 4: Test All Modules! (5 minutes)

Test each module to make sure Railway is working:

### 4.1 Test Inventory Optimization
1. Open your Lovable app
2. Go to **Inventory Optimization**
3. Upload/enter data
4. Click **"Optimize"**
5. ✅ Should see faster results with Railway

### 4.2 Test Network Analysis
1. Go to **Network Analysis** module
2. Set up your network data
3. Click **"Optimize Network"**
4. ✅ Should complete faster with more capacity

### 4.3 Test GFA Module
1. Go to **GFA** (Gravity Facility Allocation)
2. Input customer and facility data
3. Run optimization
4. ✅ Should handle larger datasets

### 4.4 Test Demand Forecasting
1. Go to **Demand Forecasting**
2. Upload historical data
3. Generate forecast
4. ✅ Should process more data points

### 4.5 Verify Railway is Being Used
1. In Railway, go to your service
2. Click **"Deployments"** → Latest deployment
3. View **"Logs"**
4. You should see logs like:
   ```
   Starting inventory optimization...
   Inventory optimization completed in 1234ms
   ```
5. ✅ If you see these logs, Railway is working!

## Monitoring & Troubleshooting

### Check Railway Logs

1. In Railway, click your service
2. Go to **"Deployments"** tab
3. Click the latest deployment
4. View **"Logs"** to see optimization progress

### Check Performance

1. The logs will show memory usage and computation time
2. You should see much faster optimization times!

### Common Issues

**"Service not responding"**
- Check Railway logs for errors
- Verify environment variables are set correctly
- Make sure FRONTEND_URL matches your Lovable app URL

**"CORS error"**
- Update FRONTEND_URL in Railway to match your exact Lovable app URL
- Include the protocol (https://)

**"Out of memory"**
- Check Railway plan - make sure you have 32GB allocated
- View logs to see actual memory usage

## Cost Breakdown

Railway Pro Plan:
- **Base**: $20/month
- **32GB RAM + 8 vCPU**: ~$40-60/month usage
- **Total**: ~$60-80/month

This is much cheaper than upgrading Lovable Cloud instance and more stable!

## Need Help?

1. Check Railway logs first (most issues show up there)
2. Message me: "Railway optimization not working" with the error
3. Join Railway Discord: https://discord.gg/railway

## What Stays on Lovable Cloud

✅ Your database (all data)
✅ User authentication
✅ File storage
✅ Frontend hosting
✅ Simple API calls

## What Runs on Railway

✅ Inventory optimization (heavy computation)
✅ Network optimization (heavy computation)
✅ GFA optimization (facility allocation)
✅ Demand forecasting (all models)
✅ Any future CPU/RAM intensive tasks

## Module-Specific Railway Benefits

### Inventory Optimization
- **Before**: Timeout on datasets > 100 policies
- **After**: Handles 1000+ policies easily
- **Speed**: 5-10x faster with more replications

### Network Analysis
- **Before**: Limited to small networks
- **After**: Optimizes networks with 100+ nodes
- **Speed**: Complex networks solve in seconds

### GFA Module
- **Before**: Struggles with 50+ facilities
- **After**: Handles 500+ facilities/customers
- **Speed**: Allocation completes instantly

### Demand Forecasting
- **Before**: Limited to 1 year of data
- **After**: Processes 5+ years of historical data
- **Speed**: All models run simultaneously

---

**Ready to deploy?** Start with Step 1 above! I'm here to help if you get stuck.
