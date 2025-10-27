# Testing AWS Bedrock Auto Image Generation

## Quick Test Guide

### 1. Set Environment Variables

Before starting the server, set your AWS credentials:

```bash
export AWS_ACCESS_KEY_ID="your-aws-access-key-id"
export AWS_SECRET_ACCESS_KEY="your-aws-secret-access-key"
```

### 2. Test with Docker (Recommended)

```bash
# Build and run with environment variables
docker-compose build
docker-compose up

# Or pass env vars directly
docker run -e AWS_ACCESS_KEY_ID="your-key" \
           -e AWS_SECRET_ACCESS_KEY="your-secret" \
           -p 3000:3000 \
           your-image-name
```

### 3. Test the Feature

1. **Navigate to the app** - http://localhost:3000

2. **Generate Content with Images**
   - In the "AI Idea Generator" section
   - Check the box "📸 Include AI-generated image suggestions in content"
   - Enter a prompt like: "Create a business presentation about quarterly sales"
   - Click "🚀 Expand Idea"

3. **Generate Preview**
   - Click "👁️ Generate Preview"
   - Wait for slides to appear

4. **Watch Auto Image Generation**
   - The system will automatically detect image descriptions
   - After 1 second delay, you'll see:
     - Notification: "🤖 Auto-generating X images with AWS Bedrock Nova Canvas..."
     - Gallery tab automatically opens
     - Progress bar shows generation status
     - Images appear one-by-one as they're generated

5. **Verify in Preview**
   - Switch back to "📄 Slides" tab
   - Scroll through slides - images should be embedded

6. **Verify in PowerPoint**
   - Click "✨ Generate PowerPoint Presentation"
   - Check console log for: `✅ Images will be embedded in PowerPoint!`
   - Download and open the PPTX file
   - Images should be present in the slides

## Expected Console Output

### Server Console

```bash
🖼️  Auto-generating 3 images with AWS Bedrock Nova Canvas
  [1/3] Generating: A professional chart showing quarterly sales...
🎨 Generating image with AWS Bedrock Nova Canvas...
✅ Image generated successfully with Nova Canvas
  ✅ [1/3] Sent to client: slide-2
  [2/3] Generating: A graph depicting market growth trends...
🎨 Generating image with AWS Bedrock Nova Canvas...
✅ Image generated successfully with Nova Canvas
  ✅ [2/3] Sent to client: slide-4
  [3/3] Generating: An infographic about customer segments...
🎨 Generating image with AWS Bedrock Nova Canvas...
✅ Image generated successfully with Nova Canvas
  ✅ [3/3] Sent to client: slide-6
✅ Auto-generation complete: 3 success, 0 failed
```

### Browser Console

```javascript
📋 Found 3 image descriptions - auto-generating...
📡 Receiving REAL-TIME streaming images from AWS Bedrock...
🖼️  [1/3] Image received: Quarterly Sales
  ✅ Inserted into slide data: Slide 2
  📄 Updated slide 2 preview with image (REAL-TIME!)
  🎨 Displayed in gallery: Image 1
🖼️  [2/3] Image received: Market Growth
  ✅ Inserted into slide data: Slide 4
  📄 Updated slide 4 preview with image (REAL-TIME!)
  🎨 Displayed in gallery: Image 2
🖼️  [3/3] Image received: Customer Segments
  ✅ Inserted into slide data: Slide 6
  📄 Updated slide 6 preview with image (REAL-TIME!)
  🎨 Displayed in gallery: Image 3
✅ Stream complete: 3 success, 0 failed
✅ Generated 3 images and inserted into slides!
```

## Verify Images in Slide Data

Run this in browser console:

```javascript
window.verifyImagesInSlideData()
```

Expected output:

```
═══════════════════════════════════════════════
🔍 IMAGE INSERTION VERIFICATION
═══════════════════════════════════════════════
📊 Checking all slides:

✅ Slide 2: "Quarterly Sales Performance"
   - Has imageUrl: data:image/png;base64,iVBORw0KG...
   - Image type: Base64 embedded
   - Will be in PowerPoint: YES ✓

✅ Slide 4: "Market Growth Analysis"
   - Has imageUrl: data:image/png;base64,iVBORw0KG...
   - Image type: Base64 embedded
   - Will be in PowerPoint: YES ✓

✅ Slide 6: "Customer Segmentation"
   - Has imageUrl: data:image/png;base64,iVBORw0KG...
   - Image type: Base64 embedded
   - Will be in PowerPoint: YES ✓

═══════════════════════════════════════════════
📈 SUMMARY:
   • Slides with ACTUAL images: 3 ✅
   • Slides with placeholders: 0 ⏳
   • Slides without images: 3
═══════════════════════════════════════════════

✅ VERIFIED: Images ARE in slide data and WILL be in PowerPoint!
   When you generate PowerPoint, server will log:
   "✅ Images will be embedded in PowerPoint!"
```

## Common Test Scenarios

### Scenario 1: Simple 3-Slide Presentation

**Input:**
```
Create a presentation about coffee shop business plan
```

**Expected:**
- 3-6 slides generated
- 0-3 images (AI decides which slides need images)
- Auto-generation triggered if any image descriptions found

### Scenario 2: Presentation with Specific Image Requests

**Input:**
```
Marketing Strategy Presentation:
- Title slide
- Market Overview (add a chart showing market size)
- Competition Analysis (add comparison infographic)
- Our Solution (add product screenshot)
- Growth Strategy (add timeline visualization)
```

**Expected:**
- 5 slides generated
- 4 images automatically generated
- All images embedded in PowerPoint

### Scenario 3: No Images Requested

**Input:**
```
Simple text-only presentation about company policies
```

**Expected:**
- Slides generated
- No auto-generation triggered (no image descriptions)
- No errors

## Troubleshooting Tests

### Test 1: Verify AWS Credentials

```bash
# Check if env vars are set
echo $AWS_ACCESS_KEY_ID
echo $AWS_SECRET_ACCESS_KEY

# Should output your credentials (not empty)
```

### Test 2: Test Bedrock API Directly

Create `test-bedrock.js`:

```javascript
const {
    BedrockRuntimeClient,
    InvokeModelCommand,
} = require("@aws-sdk/client-bedrock-runtime");

async function testBedrock() {
    try {
        const client = new BedrockRuntimeClient({ region: "us-east-1" });
        const modelId = "amazon.nova-canvas-v1:0";
        
        const payload = {
            taskType: "TEXT_IMAGE",
            textToImageParams: { text: "A simple test image of a red apple" },
            imageGenerationConfig: { quality: "standard" },
        };
        
        const response = await client.send(new InvokeModelCommand({
            modelId,
            body: JSON.stringify(payload),
        }));
        
        console.log("✅ Bedrock API test successful!");
        console.log("Response size:", response.body.length, "bytes");
    } catch (error) {
        console.error("❌ Bedrock API test failed:", error.message);
    }
}

testBedrock();
```

Run:
```bash
node test-bedrock.js
```

### Test 3: Check Docker Environment

```bash
# Run container with env vars visible
docker run -it --rm \
  -e AWS_ACCESS_KEY_ID="$AWS_ACCESS_KEY_ID" \
  -e AWS_SECRET_ACCESS_KEY="$AWS_SECRET_ACCESS_KEY" \
  your-image-name \
  /bin/bash

# Inside container
echo $AWS_ACCESS_KEY_ID
node -e "console.log(process.env.AWS_ACCESS_KEY_ID)"
```

## Performance Tests

### Test 1: Single Image Generation

**Setup:** 3-slide presentation with 1 image
**Expected Time:** 5-10 seconds total
- Preview generation: 3-5 seconds
- Image generation: 3-5 seconds

### Test 2: Multiple Images

**Setup:** 10-slide presentation with 5 images
**Expected Time:** 20-35 seconds total
- Preview generation: 5-10 seconds
- Image generation: 15-25 seconds (5 images × 3-5 sec each)

### Test 3: Large Presentation

**Setup:** 20-slide presentation with 10 images
**Expected Time:** 50-80 seconds total
- Preview generation: 10-15 seconds
- Image generation: 40-65 seconds (10 images × 4-6.5 sec each)

## Integration Tests

### Test Auto-Generation Trigger

1. Generate preview without images → No auto-generation
2. Generate preview with images → Auto-generation triggered
3. Modify slides to add image → No auto-generation (only on preview)
4. Re-generate preview → Auto-generation triggered again

### Test Image Insertion

1. Generate preview with images
2. Wait for auto-generation
3. Check slide preview has images
4. Generate PowerPoint
5. Verify PowerPoint has embedded images

### Test Error Handling

1. **Invalid AWS credentials:**
   - Expected: Error message "AWS credentials not found"
   - No crash, graceful error display

2. **Network timeout:**
   - Expected: Error message "Generation timeout"
   - Other slides continue to work

3. **Model unavailable:**
   - Expected: Error message with model details
   - Fallback to placeholder

## Success Criteria

✅ **Auto-generation triggered automatically** after preview  
✅ **Images appear in gallery** one-by-one (streaming)  
✅ **Images embedded in slide preview** with fade-in animation  
✅ **Images included in PowerPoint** when generated  
✅ **No manual button click required** (button removed)  
✅ **Clear progress indication** (AWS Bedrock orange/black theme)  
✅ **Error handling** works gracefully  
✅ **Performance** acceptable (3-5 sec per image)  

## Rollback Plan

If issues occur, revert these files:

```bash
git checkout HEAD -- package.json
git checkout HEAD -- server/routes/images.js
git checkout HEAD -- public/index.html
git checkout HEAD -- public/js/imageGallery.js
git checkout HEAD -- public/js/api/slidePreview.js
```

Then restart server.

## Production Checklist

Before deploying to production:

- [ ] AWS credentials configured in environment
- [ ] IAM permissions verified for Bedrock
- [ ] Dependencies installed (`npm install`)
- [ ] Docker image tested with env vars
- [ ] End-to-end test completed successfully
- [ ] Error handling verified
- [ ] Performance acceptable (< 5 sec per image)
- [ ] Cost monitoring configured (AWS Budgets)
- [ ] Backup image generation method available (optional)

## Monitoring

Monitor these metrics in production:

- **Image generation success rate** (target: >95%)
- **Average generation time** (target: <5 sec)
- **API errors** (target: <1%)
- **Cost per month** (track via AWS billing)
- **User satisfaction** (images enhance presentations)

## Next Steps

After successful testing:

1. ✅ Deploy to staging environment
2. ✅ Run integration tests
3. ✅ Deploy to production
4. ✅ Monitor for 24 hours
5. ✅ Gather user feedback
6. ✅ Optimize based on usage patterns

