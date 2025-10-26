# Docker Configuration for genis.ai

## Single Optimized Dockerfile

This project uses **one production-ready Dockerfile** located at `/Dockerfile`.

### Pre-configured Settings

```dockerfile
BASE_URL=https://genis.ai
PORT=3000
```

### What's Included

✅ **Node.js 18** (Bullseye/Debian base)  
✅ **LibreOffice** (PDF conversion)  
✅ **Python 3** (Document processing)  
✅ **Playwright Chromium** (Advanced rendering)  
✅ **Security** (Non-root user)  
✅ **Health Checks** (Production monitoring)  

### File Size

- Image size: ~2.5GB (includes LibreOffice + Playwright)
- Build time: ~5-8 minutes (first build)
- Cached rebuild: ~30 seconds

## Local Testing

```bash
# Build the image
docker build -t genis-ai .

# Run with default settings (genis.ai)
docker run -p 3000:3000 genis-ai

# Run with custom domain
docker run -p 3000:3000 -e BASE_URL=https://custom.com genis-ai

# Test the server
curl http://localhost:3000/api/health
```

## Railway Deployment

Railway automatically:
1. Detects the Dockerfile
2. Builds the image
3. Deploys to production
4. Uses `BASE_URL=https://genis.ai` by default

**To override BASE_URL in Railway:**
```
Dashboard → Variables → Add Variable
BASE_URL=https://yourdomain.com
```

## Dependencies

### Node.js Packages
- `pptxgenjs` - PowerPoint generation
- `@ant/html2pptx` - HTML to PPTX conversion
- `express` - Web server
- `playwright` - Browser automation
- `sharp` - Image processing
- And more (see package.json)

### Python Packages
- `python-docx` - Word document processing
- `openpyxl` - Excel processing
- `reportlab` - PDF generation
- `pypdf` - PDF manipulation
- `pdfplumber` - PDF text extraction
- `pandas` - Data analysis

### System Packages
- LibreOffice (Writer, Impress, Calc)
- Liberation Fonts
- Noto Fonts

## Troubleshooting

### Build Failures

**npm ci fails:**
The Dockerfile has automatic fallback to `npm install`

**Playwright install fails:**
Increase Docker memory to at least 2GB

**LibreOffice missing:**
Ensure you're using Debian-based image (bullseye)

### Runtime Issues

**Out of memory:**
Increase container memory (Railway: upgrade plan)

**PDF conversion fails:**
Check LibreOffice installation with:
```bash
docker exec -it <container> which libreoffice
```

**Shareable links wrong domain:**
Set `BASE_URL` environment variable in Railway

## Production Optimizations

The Dockerfile includes:
- ✅ Multi-stage build pattern (efficient)
- ✅ Layer caching (faster rebuilds)
- ✅ Production-only dependencies (`--omit=dev`)
- ✅ Minimal packages (security)
- ✅ Non-root user (security)
- ✅ Health checks (monitoring)
- ✅ Cleanup commands (smaller image)

## Security Features

1. **Non-root user** (`appuser`)
2. **Limited permissions** (755 on workspace)
3. **No dev dependencies** in production
4. **Health monitoring** endpoint
5. **Minimal attack surface** (only required packages)

---

**Last Updated:** October 2024  
**Maintainer:** genis.ai Team  
**Docker Hub:** Not published (deploy from source)

