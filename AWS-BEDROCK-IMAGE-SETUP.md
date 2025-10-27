# AWS Bedrock Nova Canvas - Automatic Image Generation Setup

## Overview

This application now uses **AWS Bedrock Nova Canvas** for automatic AI-powered image generation. Images are generated automatically when slide previews are created, with no manual button click required.

## Features

✅ **Automatic Image Generation** - Images generated automatically after slide preview  
✅ **AWS Bedrock Nova Canvas v1.0** - High-quality AI image generation  
✅ **Real-time Streaming** - Images appear one-by-one as they're generated  
✅ **Embedded in Slides** - Generated images are automatically inserted into both preview and PowerPoint  
✅ **No API Key Required** - Uses AWS credentials from environment variables  

## Setup Instructions

### 1. Set Environment Variables

The AWS SDK will automatically load credentials from environment variables:

```bash
export AWS_ACCESS_KEY_ID="your-aws-access-key-id"
export AWS_SECRET_ACCESS_KEY="your-aws-secret-access-key"
```

Or add them to your `.env` file:

```
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
```

### 2. Install Dependencies

```bash
npm install
```

This will install the AWS SDK:
- `@aws-sdk/client-bedrock-runtime`: ^3.600.0

### 3. AWS IAM Permissions

Ensure your AWS IAM user/role has the following permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel"
      ],
      "Resource": "arn:aws:bedrock:us-east-1::foundation-model/amazon.nova-canvas-v1:0"
    }
  ]
}
```

### 4. Start the Server

```bash
npm start
```

## How It Works

### Automatic Flow

1. User generates slide preview
2. System detects slides with `imageDescription` fields
3. Automatically calls AWS Bedrock Nova Canvas for each description
4. Images stream back in real-time
5. Images are inserted into:
   - Slide preview (HTML)
   - Slide data (for PowerPoint generation)
   - Image gallery tab

### Technical Details

#### Backend (Server)

**New Endpoint:** `/api/images/auto-generate`
- Accepts: `{ slideData }`
- Returns: Server-Sent Events (SSE) stream
- Uses: AWS Bedrock Nova Canvas v1.0

**Code Location:** `server/routes/images.js`

```javascript
async function generateWithBedrock(description) {
    const client = new BedrockRuntimeClient({ region: "us-east-1" });
    const modelId = "amazon.nova-canvas-v1:0";
    
    const payload = {
        taskType: "TEXT_IMAGE",
        textToImageParams: { text: description },
        imageGenerationConfig: {
            seed: Math.floor(Math.random() * 858993460),
            quality: "standard",
        },
    };
    
    const response = await client.send(new InvokeModelCommand({
        modelId,
        body: JSON.stringify(payload),
    }));
    
    return responseBody.images[0]; // Base64 PNG
}
```

#### Frontend (Client)

**Auto-generation Function:** `autoGenerateImagesForSlides()`
- Location: `public/js/imageGallery.js`
- Called automatically after preview generation
- Shows real-time progress in Image Gallery tab

**UI Changes:**
- Removed manual "Generate Images" button
- Added "🤖 Auto AI Image Generation" indicator
- Updated progress bar colors to AWS orange/black

## Configuration

### AWS Region

The default region is `us-east-1`. To change:

```javascript
// server/routes/images.js, line 402
const client = new BedrockRuntimeClient({ region: "us-east-1" });
```

### Image Quality

```javascript
// server/routes/images.js, line 419
quality: "standard",  // Options: "standard", "premium"
```

### Model ID

```javascript
// server/routes/images.js, line 405
const modelId = "amazon.nova-canvas-v1:0";
```

## Testing

### 1. Test with Docker (Production Environment)

```bash
# Build and run
docker-compose up --build

# Or use the test script
./scripts/test-docker-optimization.sh
```

### 2. Test Locally

```bash
# Set environment variables
export AWS_ACCESS_KEY_ID="your-key"
export AWS_SECRET_ACCESS_KEY="your-secret"

# Start server
npm start

# Navigate to http://localhost:3000
# Generate a slide preview with images enabled
# Watch the Image Gallery tab for automatic generation
```

### 3. Verify Images in PowerPoint

1. Generate preview with images
2. Wait for automatic image generation
3. Click "Generate PowerPoint Presentation"
4. Check console logs for:
   ```
   ✅ Images will be embedded in PowerPoint!
   ```
5. Open downloaded PPTX and verify images are present

## Troubleshooting

### Error: "AWS credentials not found"

**Solution:** Ensure environment variables are set:
```bash
echo $AWS_ACCESS_KEY_ID
echo $AWS_SECRET_ACCESS_KEY
```

### Error: "AccessDenied"

**Solution:** Check IAM permissions for `bedrock:InvokeModel`

### Error: "Region error"

**Solution:** Ensure Bedrock is available in your region (default: us-east-1)

### Images not appearing in preview

**Solution:** Check browser console for errors. Verify:
1. Preview generated successfully
2. Image descriptions exist in slides
3. Auto-generation function is called
4. No network errors

### Images not appearing in PowerPoint

**Solution:** Verify in browser console:
```javascript
window.verifyImagesInSlideData()
```

Should show:
```
✅ VERIFIED: Images ARE in slide data and WILL be in PowerPoint!
```

## API Response Format

### Streaming Response (SSE)

```javascript
// Image event
data: {
  "type": "image",
  "image": {
    "id": "slide-2",
    "slideIndex": 2,
    "slideTitle": "Market Analysis",
    "description": "A chart showing market trends",
    "url": "data:image/png;base64,...",
    "provider": "bedrock-nova-canvas",
    "model": "amazon.nova-canvas-v1:0",
    "seed": 12345678,
    "timestamp": 1234567890
  },
  "current": 1,
  "total": 3
}

// Error event
data: {
  "type": "error",
  "error": {
    "id": "slide-3",
    "slideIndex": 3,
    "description": "...",
    "error": "Error message",
    "timestamp": 1234567890
  }
}

// Complete event
data: {
  "type": "complete",
  "success": 2,
  "failed": 1,
  "total": 3
}
```

## Files Modified

### Backend
- ✅ `package.json` - Added AWS SDK dependency
- ✅ `server/routes/images.js` - Added Bedrock integration and auto-generate endpoint

### Frontend
- ✅ `public/index.html` - Removed manual button, added auto-generation indicator
- ✅ `public/js/imageGallery.js` - Added `autoGenerateImagesForSlides()` function
- ✅ `public/js/api/slidePreview.js` - Added automatic trigger after preview

## Performance

- **Generation Time:** ~3-5 seconds per image
- **Streaming:** Images appear as soon as generated
- **Concurrent Requests:** Sequential (one at a time) to avoid rate limits
- **Image Format:** PNG, base64 encoded
- **Image Size:** Typically 100-500 KB per image

## Cost Considerations

AWS Bedrock Nova Canvas pricing (as of 2024):
- Standard quality: ~$0.04 per image
- Premium quality: ~$0.08 per image

Example:
- 10-slide presentation with 5 images = $0.20 (standard)
- 20-slide presentation with 10 images = $0.40 (standard)

## Security

- ✅ AWS credentials from environment (not in code)
- ✅ Server-side generation only (no client-side credentials)
- ✅ Images transmitted as base64 over HTTPS
- ✅ No image storage on server (ephemeral)

## Future Enhancements

- [ ] Batch image generation for performance
- [ ] Image caching to reduce API calls
- [ ] Custom image dimensions (16:9, 4:3, square)
- [ ] Image style selection (realistic, artistic, etc.)
- [ ] Manual regeneration for individual images
- [ ] Image editing/refinement

## Support

For issues or questions:
1. Check browser console for detailed error messages
2. Check server logs for AWS Bedrock errors
3. Verify AWS credentials and permissions
4. Test with a simple 3-slide presentation first

## License

Same as parent project (MIT)

