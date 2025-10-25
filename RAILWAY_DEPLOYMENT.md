# Railway Deployment Guide for genis.ai

## Docker Setup

The project includes a single optimized `Dockerfile` with:
- ✅ `BASE_URL=https://genis.ai` pre-configured
- ✅ LibreOffice for PDF conversion
- ✅ Python support for document processing
- ✅ Playwright for advanced rendering
- ✅ Production-ready security (non-root user)

## Quick Deploy to Railway

### Method 1: Deploy via Railway Dashboard (Recommended)

1. **Connect Repository to Railway**
   - Go to [Railway.app](https://railway.app)
   - Click "New Project" → "Deploy from GitHub repo"
   - Select this repository

2. **Configure Environment Variables (Optional)**
   - The Dockerfile already defaults to `BASE_URL=https://genis.ai`
   - Only set this if using a different domain:
     - Go to Railway dashboard → Your project
     - Click on "Variables" tab
     - Add: `BASE_URL=https://yourdomain.com`

3. **Configure Build Settings**
   - Railway will automatically detect the Dockerfile
   - Default settings should work fine
   - Build Command: (auto-detected from Dockerfile)
   - Start Command: (auto-detected from Dockerfile)

4. **Deploy**
   - Railway will automatically build and deploy
   - You'll get a deployment URL like `https://your-app.up.railway.app`

### Method 2: Deploy via Railway CLI

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login to Railway
railway login

# Initialize project
railway init

# Set environment variables
railway variables set BASE_URL=https://genis.ai

# Deploy
railway up
```

## Environment Variables

### Pre-configured in Dockerfile

| Variable | Default Value | Description |
|----------|---------------|-------------|
| `BASE_URL` | `https://genis.ai` | Base URL for shareable presentation links |

### Optional Variables (Override in Railway if needed)

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port (Railway sets this automatically) | `3000` |
| `NODE_ENV` | Environment mode | `production` |

## Custom Domain Setup

### Using genis.ai Domain

1. **In Railway Dashboard:**
   - Go to your project → Settings → Domains
   - Click "Add Custom Domain"
   - Enter: `genis.ai`

2. **In Your DNS Provider:**
   Add these DNS records:
   ```
   Type: CNAME
   Name: @
   Value: [your-railway-url].up.railway.app
   
   Type: CNAME
   Name: www
   Value: [your-railway-url].up.railway.app
   ```

3. **Update Environment Variable:**
   - In Railway Variables, set: `BASE_URL=https://genis.ai`

## Verifying Deployment

After deployment, check:

1. **Health Endpoint:**
   ```bash
   curl https://genis.ai/api/health
   ```
   Should return: `{"status":"ok","version":"..."}`

2. **Share URL Test:**
   - Create a presentation
   - Generate a share link
   - Verify it uses `https://genis.ai/view/...` format

## Troubleshooting

### Shareable Links Show Wrong Domain

**Problem:** Share URLs show Railway's default domain instead of genis.ai

**Solution:**
1. Verify `BASE_URL` is set in Railway Variables
2. Restart the deployment
3. Check server logs: `railway logs`

### Build Failures

**Problem:** Docker build fails during deployment

**Solution:**
1. Check Railway build logs
2. Ensure all files are committed to Git
3. Verify `skills/pptx/html2pptx.tgz` exists in repository

### Memory Issues

**Problem:** Server crashes with out-of-memory errors

**Solution:**
1. Upgrade Railway plan for more memory
2. Current Dockerfile uses ~1.5GB RAM (LibreOffice + Node + Playwright)
3. Recommended: Hobby plan or higher

## Monitoring

### View Logs
```bash
railway logs
```

### View Metrics
- Go to Railway dashboard → Your project → Metrics
- Monitor CPU, Memory, Network usage

## Scaling

Railway automatically scales your application. For high traffic:

1. **Horizontal Scaling:**
   - Railway Pro plan supports multiple instances
   - Load balancing is automatic

2. **Vertical Scaling:**
   - Upgrade Railway plan for more resources
   - Adjust memory limits if needed

## Updates and Redeployment

### Automatic Deployments
- Connect GitHub repository to Railway
- Enable auto-deploy on push to main branch
- Every commit triggers a new deployment

### Manual Deployment
```bash
railway up
```

## Support

For issues specific to:
- **Railway Platform:** [Railway Discord](https://discord.gg/railway)
- **Application Issues:** Check server logs with `railway logs`
- **DNS/Domain Issues:** Contact your DNS provider

## Cost Estimate

**Railway Pricing (as of 2024):**
- **Hobby Plan:** $5/month (recommended minimum)
  - 512MB RAM, 1 vCPU
  - $5 credit included
  - Pay for usage beyond credit

- **Pro Plan:** $20/month
  - 8GB RAM, 8 vCPU
  - Better for production use
  - Multiple instances support

**Expected monthly cost for genis.ai:**
- Low traffic (< 1000 requests/day): ~$5-10/month
- Medium traffic (< 10,000 requests/day): ~$15-25/month
- High traffic (> 10,000 requests/day): ~$30-50/month

---

## Quick Reference

```bash
# View environment variables
railway variables

# Set BASE_URL
railway variables set BASE_URL=https://genis.ai

# View logs
railway logs

# Restart service
railway restart

# Open in browser
railway open

# Check status
railway status
```

---

**Last Updated:** October 2024  
**Deployment Platform:** Railway.app  
**Application:** genis.ai AI Presentation Generator

