# Render Backend Troubleshooting Guide

## Connection Failed? Follow These Steps

### Step 1: Check if Your Service is Deployed

1. **Go to your Render dashboard**: https://dashboard.render.com
2. **Find your service** (should be named something like "optimization-backend" or "nov9")
3. **Check the status indicator**:
   - 🟢 **Green "Live"** = Service is running ✓
   - 🟡 **Yellow "Building"** = Still deploying (wait a few minutes)
   - 🔴 **Red "Failed"** = Deployment failed (see Step 2)
   - ⚪ **"Suspended"** = Service is paused (click "Resume")

### Step 2: If Deployment Failed

1. Click on your service in Render dashboard
2. Go to the **"Logs"** tab
3. Look for error messages (usually in red)
4. Common issues:
   - **"Module not found"**: Missing dependencies in package.json
   - **"Port already in use"**: Usually auto-resolves on next deploy
   - **"Out of memory"**: Upgrade your Render plan or optimize code

### Step 3: Verify Your Service URL

1. In Render dashboard, click on your service
2. Find the **URL** at the top (looks like `https://your-service.onrender.com`)
3. Copy this exact URL
4. In your Lovable app, check `.env` file:
   ```
   VITE_USE_RAILWAY_BACKEND=true
   VITE_RAILWAY_BACKEND_URL=https://your-service.onrender.com
   ```
5. Make sure there's **NO trailing slash** at the end of the URL
6. **Refresh your Lovable app** after changing .env

### Step 4: Test the Backend Directly

Open this URL in your browser (replace with your actual Render URL):
```
https://nov9.onrender.com/health
```

**Expected response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "memory": {...}
}
```

**If you see this** = Your backend is working! ✓  
**If you get an error** = Backend isn't running (see Step 1-2)

### Step 5: Check CORS Settings

If backend is running but connection still fails:

1. In your `railway-backend/server.js`, verify CORS is configured:
   ```javascript
   app.use(cors({
     origin: process.env.FRONTEND_URL || '*',
     credentials: true
   }));
   ```
2. The `'*'` allows all origins (good for testing)
3. In production, replace `'*'` with your actual Lovable app URL

### Step 6: Render Free Tier Limitations

**Important**: Render free tier has limitations:
- Services **spin down after 15 minutes** of inactivity
- First request after spin-down takes **30-60 seconds** to wake up
- This is normal behavior on free tier

**Solution**: 
- Upgrade to paid tier ($7/month) for always-on service
- OR be patient on first request (it will wake up)

### Step 7: Check Environment Variables

In Render dashboard:
1. Go to your service
2. Click **"Environment"** tab
3. Verify these are set:
   - `NODE_ENV` = `production`
   - `NODE_OPTIONS` = `--max-old-space-size=32768` (for 32GB RAM)
   - `PORT` = (leave empty, Render sets this automatically)

### Step 8: Still Not Working?

Try these:
1. **Manual redeploy**: In Render dashboard, click "Manual Deploy" → "Deploy latest commit"
2. **Check service logs**: Look for any runtime errors
3. **Verify package.json**: Make sure all dependencies are listed
4. **Test locally**: Run `npm install && npm start` in railway-backend folder

### Quick Diagnostic Checklist

- [ ] Service shows "Live" status in Render dashboard
- [ ] `/health` endpoint returns JSON when accessed in browser
- [ ] VITE_RAILWAY_BACKEND_URL in .env matches Render service URL
- [ ] VITE_USE_RAILWAY_BACKEND=true in .env
- [ ] App has been refreshed after .env changes
- [ ] No CORS errors in browser console
- [ ] Service hasn't been suspended due to inactivity

## Common Error Messages

### "Cannot reach [URL] - Check if service is deployed and running"
→ Service is either not deployed or has failed. Check Render dashboard.

### "Connection timeout"
→ Service is taking too long to respond. Might be spinning up from sleep (wait 60s).

### "Failed to fetch"
→ CORS issue or service is completely offline. Check Render logs.

### "HTTP 503"
→ Service is temporarily unavailable. Check if it's still building.

## Need More Help?

- **Render Status**: https://status.render.com
- **Render Docs**: https://render.com/docs
- **Render Community**: https://community.render.com

---

**Pro Tip**: Keep the Render dashboard open while testing to watch logs in real-time!
