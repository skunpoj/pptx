# PDF Conversion & File Storage Implementation Plan

## PDF Conversion Solutions

### Option 1: LibreOffice (RECOMMENDED) ✅
**Pros:**
- Most reliable for PPT→PDF conversion
- Maintains formatting perfectly
- Free and open-source
- Works in Docker
- Command-line interface

**Cons:**
- Requires installation (~200MB)
- Slightly slower than native solutions

**Implementation:**
```dockerfile
# Add to Dockerfile
RUN apt-get update && apt-get install -y \
    libreoffice \
    libreoffice-writer \
    libreoffice-impress \
    && rm -rf /var/lib/apt/lists/*
```

**Conversion Command:**
```bash
soffice --headless --convert-to pdf --outdir ./output presentation.pptx
```

### Option 2: unoconv (LibreOffice wrapper)
**Pros:**
- Simpler CLI than LibreOffice
- Same quality as LibreOffice

**Cons:**
- Still requires LibreOffice
- Additional dependency

### Option 3: pdf-lib + images (NOT RECOMMENDED)
**Pros:**
- Pure JavaScript
- No external dependencies

**Cons:**
- Poor quality for PowerPoint
- Complex implementation
- Limited feature support

## Storage Strategy

### For Download Links: YES, Files Must Be Stored

**Why?**
- Direct download links need actual files on disk or in storage
- Can't regenerate on-the-fly for every download
- Need to serve same file to multiple users
- Shareable links require persistent storage

### Storage Options

#### Option 1: Local File System (Simple, Fast) ✅
**Best for:** Development, small deployments
```javascript
/workspace/
  /generated/
    /presentations/
      /{sessionId}/
        presentation.pptx
        presentation.pdf
    /shared/
      /{shareId}/
        presentation.pptx
        presentation.pdf
```

**Pros:**
- Simple implementation
- Fast access
- No external dependencies

**Cons:**
- Lost on server restart (use volumes)
- Not scalable to multiple servers
- Limited disk space

#### Option 2: Cloud Storage (AWS S3, Google Cloud Storage)
**Best for:** Production, scalability
**Pros:**
- Unlimited storage
- Durable and reliable
- Multi-server support
- Can set expiration policies

**Cons:**
- Requires cloud account
- Additional cost
- Network latency

#### Option 3: Database (MongoDB GridFS, PostgreSQL BYTEA)
**Best for:** Medium-scale applications
**Pros:**
- Centralized storage
- Easy backup
- Access control

**Cons:**
- Database bloat
- Slower than file system
- More complex

## Recommended Implementation

### Phase 1: Local Storage + LibreOffice (Immediate)
1. Store files in `/workspace/generated`
2. Use LibreOffice for PDF conversion
3. Serve via Express static/download endpoints
4. Auto-cleanup old files (7 days)

### Phase 2: Add Cloud Storage (Production)
1. Upload to S3/GCS after generation
2. Return pre-signed URLs
3. Set object expiration (7 days)
4. Remove local files after upload

## File Lifecycle

```
1. Generate PPTX
   ├─> Save to /generated/{sessionId}/presentation.pptx
   └─> Return download URL: /download/{sessionId}/presentation.pptx

2. Convert to PDF
   ├─> Run: soffice --headless --convert-to pdf
   └─> Save to /generated/{sessionId}/presentation.pdf
   └─> Return download URL: /download/{sessionId}/presentation.pdf

3. Serve Downloads
   ├─> GET /download/{sessionId}/presentation.pptx
   └─> Stream file to client

4. Cleanup (After 7 days)
   └─> Delete /generated/{sessionId}/
```

## Storage Size Estimates

### Per Presentation
- PPTX: 50KB - 5MB (avg: 500KB)
- PDF: 100KB - 10MB (avg: 1MB)
- Total: ~1.5MB per presentation

### Capacity Planning
- 100 presentations/day = 150MB/day
- 7-day retention = 1GB storage needed
- 1000 presentations/day = 10GB storage (7-day retention)

## Implementation Details

### Directory Structure
```
/workspace/
  /generated/          # Temporary generated files
    /{sessionId}/      # Per-session directory
      presentation.pptx
      presentation.pdf
      metadata.json    # Creation time, share info, etc.
  /shared/             # Shared presentations (longer retention)
    /{shareId}/
      presentation.pptx
      presentation.pdf
      metadata.json
```

### Metadata Format
```json
{
  "sessionId": "1729900000000",
  "shareId": "Abc12Xyz",
  "title": "Q4 Business Review",
  "createdAt": "2024-10-25T15:30:00Z",
  "expiresAt": "2024-11-01T15:30:00Z",
  "pptxSize": 487234,
  "pdfSize": 892456,
  "downloads": 5
}
```

## Security Considerations

1. **Path Traversal Prevention**
   - Validate session IDs (alphanumeric only)
   - Use `path.join()` and `path.resolve()`

2. **Access Control**
   - Generate random session IDs
   - Optional: Add access tokens

3. **Rate Limiting**
   - Limit downloads per IP
   - Prevent abuse

4. **File Size Limits**
   - Max 50MB per file
   - Prevent disk exhaustion

## Auto-Cleanup Implementation

```javascript
// Run every hour
setInterval(cleanupOldFiles, 60 * 60 * 1000);

async function cleanupOldFiles() {
  const dirs = ['generated', 'shared'];
  const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
  
  for (const dir of dirs) {
    const files = await fs.readdir(path.join('/workspace', dir));
    for (const file of files) {
      const metadata = await readMetadata(file);
      if (Date.now() - metadata.createdAt > maxAge) {
        await fs.rm(file, { recursive: true });
      }
    }
  }
}
```

## Cost Analysis

### Local Storage (Recommended for Start)
- **Cost:** $0 (uses server disk)
- **Capacity:** 10-50GB typical
- **Scaling:** Vertical only

### AWS S3
- **Storage:** $0.023/GB/month
- **Requests:** $0.0004 per 1000 PUT, $0.0005 per 1000 GET
- **Transfer:** First 100GB free/month
- **Example:** 1000 presentations/day = ~$2-3/month

### Google Cloud Storage
- **Storage:** $0.020/GB/month
- **Operations:** Similar to S3
- **Example:** 1000 presentations/day = ~$2-3/month

## Next Steps

1. ✅ Update Dockerfile with LibreOffice
2. ✅ Create storage directories
3. ✅ Implement PDF conversion endpoint
4. ✅ Add download endpoints for PPTX and PDF
5. ✅ Implement auto-cleanup
6. ✅ Add metadata tracking
7. 📝 (Optional) Add cloud storage for production

## Conclusion

**Recommended Approach:**
- Use **LibreOffice** for PDF conversion (reliable, high-quality)
- Use **local file system** storage (simple, fast)
- Implement **auto-cleanup** (prevent disk bloat)
- Store **metadata** for tracking
- **Later:** Migrate to S3/GCS for production scale

This provides excellent performance and reliability while keeping implementation simple.

