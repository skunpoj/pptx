# 🔧 Fixing 502 Bad Gateway Error

## What This Means
502 Bad Gateway = Your web server can't reach the Node.js backend.

---

## Quick Fix (Most Common)

### Step 1: Check if Container is Running
```bash
docker-compose ps
```

**Expected:** Container should show "Up"  
**If not:** Container crashed or isn't running

### Step 2: Check Logs
```bash
docker-compose logs --tail=100
```

Look for:
- ❌ `Error: listen EADDRINUSE :::3000` (port already in use)
- ❌ `Cannot find module` (missing dependencies)
- ❌ Crash/stack trace
- ✅ `Server running on port 3000` (good!)

### Step 3: Restart Container
```bash
docker-compose down
docker-compose up -d
```

### Step 4: Watch Logs
```bash
docker-compose logs -f
```

**Look for:**
```
✅ Server running on port 3000
```

---

## Common Causes & Solutions

### 1. Container Not Running
**Symptoms:** `docker-compose ps` shows container as "Exit"

**Solution:**
```bash
# Check what went wrong
docker-compose logs

# Rebuild and restart
docker-compose down
docker-compose build
docker-compose up -d
```

### 2. Port Conflict
**Symptoms:** Logs show `EADDRINUSE :::3000`

**Solution:**
```bash
# Find what's using port 3000
docker ps -a | grep 3000

# Stop conflicting container
docker stop <container-id>

# Or change port in docker-compose.yml
ports:
  - "3001:3000"  # Use 3001 externally instead
```

### 3. Server Crashed on Startup
**Symptoms:** Container starts then immediately exits

**Solution:**
```bash
# Check startup logs
docker-compose logs

# Common issues:
# - Missing dependencies: Rebuild with docker-compose build
# - Syntax error: Check recent code changes
# - Environment issue: Check docker-compose.yml env vars
```

### 4. Dependencies Missing
**Symptoms:** `Cannot find module 'express'` or similar

**Solution:**
```bash
# Rebuild completely
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### 5. Code Error After Updates
**Symptoms:** Worked before, broke after code changes

**Solution:**
```bash
# Check logs for the actual error
docker-compose logs --tail=50

# If syntax error, check the files we modified:
# - public/js/api.js
# - public/js/app.js
# - server/utils/helpers.js
```

---

## Step-by-Step Diagnosis

### 1. Is Docker Running?
```bash
docker --version
docker-compose --version
```

### 2. Is Container Running?
```bash
docker-compose ps
```

**Good output:**
```
NAME                COMMAND                  STATUS
pptx-1-web-1       "docker-entrypoint.s…"   Up 2 minutes
```

**Bad output:**
```
NAME                COMMAND                  STATUS
pptx-1-web-1       "docker-entrypoint.s…"   Exit 1
```

### 3. What Do Logs Say?
```bash
docker-compose logs --tail=100
```

**Good:**
```
web-1  | Server running on port 3000
web-1  | ✓ Ready to accept connections
```

**Bad:**
```
web-1  | Error: Cannot find module 'express'
web-1  | npm ERR! missing script: start
web-1  | Server crashed with error...
```

### 4. Test Server Directly
```bash
# Get container name
docker-compose ps

# Access container
docker-compose exec web sh

# Inside container, test Node
node --version
npm --version
ls -la

# Exit
exit
```

---

## Nuclear Option (Clean Rebuild)

If nothing else works:

```bash
# Stop everything
docker-compose down -v

# Remove all Docker artifacts
docker system prune -f

# Rebuild from scratch
docker-compose build --no-cache

# Start fresh
docker-compose up -d

# Watch startup
docker-compose logs -f
```

---

## Check Your docker-compose.yml

Should look like:
```yaml
version: '3.8'
services:
  web:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
```

---

## Check Your Dockerfile

Should have:
```dockerfile
FROM node:16
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

---

## Quick Diagnostic Commands

Run these to gather info:

```bash
# Container status
docker-compose ps

# Recent logs
docker-compose logs --tail=50

# Full logs
docker-compose logs > docker-logs.txt

# System resources
docker stats --no-stream

# Network status
docker network ls
```

---

## After Fixing

Once server is running, verify:

1. **Test endpoint:**
   ```bash
   curl http://localhost:3000
   # or
   curl https://your-domain.com
   ```

2. **Check health:**
   ```
   https://your-url/test-features.html
   ```
   All tests should pass.

3. **Try preview again:**
   - Should work now!

---

## Still Not Working?

Share these outputs:

```bash
# 1. Container status
docker-compose ps

# 2. Last 100 log lines
docker-compose logs --tail=100

# 3. Docker version
docker --version
docker-compose --version
```

---

## Prevention

To avoid 502 errors:

1. **Always check logs after deploy:**
   ```bash
   docker-compose logs -f
   ```

2. **Test health endpoint:**
   ```bash
   curl http://localhost:3000/api/version
   ```

3. **Monitor container:**
   ```bash
   docker-compose ps
   ```

4. **Use restart policy in docker-compose.yml:**
   ```yaml
   restart: unless-stopped
   ```

