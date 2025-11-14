# Railway Deployment Guide - Supply Chain Optimization Service

This guide helps you deploy the high-performance optimization service to Railway.app, while keeping your database and authentication on Lovable Cloud.

## What This Does

This deployment gives you:
- **32GB RAM** for heavy computations
- **More CPU power** for faster optimization
- **Stable computation** for large datasets
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

## Step 3: Update Your Lovable App (5 minutes)

Now we need to tell your Lovable app to use the Railway service for optimization.

### 3.1 Add Railway URL to Lovable

1. Go back to your Lovable project
2. Tell me: "Add environment variable for Railway backend"
3. I'll help you add the Railway URL to your app

OR you can manually add it:

1. Open Lovable Dev Mode
2. Create/edit `.env` file:
```
VITE_RAILWAY_BACKEND_URL=https://your-service.up.railway.app
```

### 3.2 Update Frontend Code

Tell me: "Update optimization calls to use Railway backend"

I'll update your code to send optimization requests to Railway instead of Lovable Cloud.

## Step 4: Test It! (2 minutes)

1. Open your Lovable app
2. Go to **Inventory Optimization** or **Network Analysis**
3. Click **"Optimize"**
4. Your optimization should now run on Railway with 32GB RAM!

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
✅ Any future CPU/RAM intensive tasks

---

**Ready to deploy?** Start with Step 1 above! I'm here to help if you get stuck.
