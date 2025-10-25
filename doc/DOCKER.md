# 🐳 Docker Setup Guide - AI Text2PPT Pro

## Quick Start with Docker

The easiest way to run the application without worrying about Node.js installation!

### Prerequisites

- Docker installed ([Get Docker](https://docs.docker.com/get-docker/))
- Docker Compose (usually included with Docker Desktop)

### Option 1: Using Docker Compose (Recommended) ⭐

**Single command to run everything:**

```bash
docker-compose up --build
```

That's it! Open your browser to: **http://localhost:3000**

To run in background:
```bash
docker-compose up -d --build
```

To stop:
```bash
docker-compose down
```

### Option 2: Using Docker CLI

**Build the image:**
```bash
docker build -t text2ppt-pro .
```

**Run the container:**
```bash
docker run -p 3000:3000 --name ai-text2ppt text2ppt-pro
```

**Stop the container:**
```bash
docker stop ai-text2ppt
docker rm ai-text2ppt
```

## 📦 What's Included in the Docker Image

- ✅ Node.js 18
- ✅ html2pptx library (pre-installed)
- ✅ Chromium (for HTML rendering)
- ✅ All required dependencies
- ✅ Health checks

## 🎯 Usage

1. **Start the container** (using one of the methods above)
2. **Open browser** → `http://localhost:3000`
3. **Add your Anthropic API key** in the UI
4. **Generate presentations!**

## 🔧 Configuration

### Change Port

Edit `docker-compose.yml`:
```yaml
ports:
  - "8080:3000"  # Change 8080 to your preferred port
```

Or with Docker CLI:
```bash
docker run -p 8080:3000 text2ppt-pro
```

### View Logs

```bash
# Docker Compose
docker-compose logs -f

# Docker CLI
docker logs -f ai-text2ppt
```

### Access Container Shell

```bash
# Docker Compose
docker-compose exec text2ppt-pro sh

# Docker CLI
docker exec -it ai-text2ppt sh
```

## 🐛 Troubleshooting

### "Port already in use"
Change the port in docker-compose.yml or use `-p` flag with a different port

### "Build failed"
Make sure you're in the `text2ppt-pro` directory:
```bash
cd text2ppt-pro
docker-compose up --build
```

### Check container status
```bash
docker-compose ps
# or
docker ps
```

### Rebuild from scratch
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up
```

## 📊 Resource Usage

The container is lightweight:
- **Image size**: ~200-300MB
- **Memory**: ~150-300MB during operation
- **CPU**: Minimal (spikes during presentation generation)

## 🚀 Production Deployment

### Using Docker Compose

Already production-ready! The compose file includes:
- ✅ Health checks
- ✅ Automatic restarts
- ✅ Production optimizations

### Environment Variables

Add to `docker-compose.yml` if needed:
```yaml
environment:
  - NODE_ENV=production
  - PORT=3000
```

### Behind a Reverse Proxy (nginx/traefik)

The app runs on port 3000 internally. Configure your reverse proxy to forward to it.

Example nginx config:
```nginx
location / {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

## 🎓 Docker Commands Cheat Sheet

```bash
# Build and run
docker-compose up --build

# Run in background
docker-compose up -d

# Stop
docker-compose down

# View logs
docker-compose logs -f

# Restart
docker-compose restart

# Rebuild completely
docker-compose down
docker-compose build --no-cache
docker-compose up

# Check status
docker-compose ps
```

## 🔄 Updates

To update the application:

1. Get the new code
2. Rebuild:
   ```bash
   docker-compose down
   docker-compose up --build
   ```

## 💡 Advantages of Docker

✅ No need to install Node.js
✅ No need to install html2pptx
✅ Consistent environment
✅ Easy to deploy
✅ Isolated from your system
✅ One command to run

## ❓ Still Prefer Local Setup?

See the main `README.md` for local Node.js installation instructions.

---

**Ready to go?** 🐳

```bash
docker-compose up --build
```

Then open: **http://localhost:3000**
