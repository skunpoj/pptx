# AWS Bedrock Setup Guide

## Quick Start

AWS Bedrock is the **invisible default fallback** for this application. When users don't provide API keys for other providers, the system automatically uses Bedrock behind the scenes. Users never see Bedrock in the UI.

### 1. Create Environment File

Create a `.env` file in the project root directory:

```bash
# .env file
bedrock=your-aws-bedrock-api-key-here
```

### 2. Get Your AWS Bedrock API Key

You can obtain your Bedrock API key from AWS. The application uses the Bedrock Converse API with Claude Sonnet 4.5 (global model).

**API Endpoint:**
```
https://bedrock-runtime.us-east-1.amazonaws.com/model/anthropic.claude-sonnet-4-5-20250929-v1:0/converse
```

**Model ID:** `anthropic.claude-sonnet-4-5-20250929-v1:0` (global, not region-specific)

### 3. Test the Setup

**Option A: Using Docker**

```bash
# Set environment variable
export bedrock=your-api-key-here

# Run with Docker
docker-compose up
```

Or add to `docker-compose.yml`:
```yaml
environment:
  - bedrock=${BEDROCK_API_KEY}
```

**Option B: Local Development**

```bash
# Install dependencies
npm install

# Set environment variable
export bedrock=your-api-key-here

# Run server
npm start
```

### 4. Verify It's Working

1. Open the application in your browser
2. **Don't configure any API keys** (leave all provider keys empty)
3. Try generating a presentation
4. It should work automatically using Bedrock in the background
5. Check browser console - should show: "No API key found for provider: anthropic, using default backend provider"
6. Check server logs - should show: "No user API key provided, using default backend provider"

**Note:** Users won't see "Bedrock" anywhere in the UI - it works invisibly in the background.

## Configuration for Different Environments

### Railway

1. Go to your Railway project
2. Click on "Variables" tab
3. Add new variable:
   - **Name:** `bedrock`
   - **Value:** Your AWS Bedrock API key

### Heroku

```bash
heroku config:set bedrock=your-api-key-here
```

### Docker

```dockerfile
# In Dockerfile
ENV bedrock=${BEDROCK_API_KEY}
```

```bash
# When running
docker run -e bedrock=your-api-key-here your-image
```

### Kubernetes

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: bedrock-secret
type: Opaque
stringData:
  bedrock: your-api-key-here
```

## How It Works

1. **Invisible Default:**
   - Bedrock is **NOT shown in the UI** - users only see: Anthropic, OpenAI, Gemini, OpenRouter
   - When users don't provide API keys, the backend automatically uses Bedrock
   - No configuration required from users

2. **Automatic Fallback:**
   - User selects any provider (e.g., Anthropic) but doesn't enter an API key
   - Frontend sends empty API key to backend
   - Backend detects empty API key and switches to Bedrock automatically
   - User never knows Bedrock is being used - it just works

3. **User Choice:**
   - Users can configure their own API keys for Anthropic, OpenAI, Gemini, or OpenRouter
   - When they do, those providers are used instead of Bedrock
   - Seamless experience - if their key expires or is invalid, falls back to Bedrock

## Testing Without Bedrock

If you want to test the application without configuring Bedrock (using user-provided API keys):

1. Don't set the `bedrock` environment variable
2. Users will need to configure their own API keys (Anthropic, OpenAI, Gemini, or OpenRouter)
3. The application will show an error if no API keys are configured

## Security Best Practices

✅ **Never commit `.env` file** to version control  
✅ **Use environment variables** in production  
✅ **Rotate API keys** regularly  
✅ **Monitor usage** and set up alerts  
✅ **Implement rate limiting** if needed  

## Troubleshooting

**Problem:** Application shows "Bedrock API key not found in environment variable"

**Solution:**
```bash
# Verify environment variable is set
echo $bedrock

# If empty, set it:
export bedrock=your-api-key-here

# Restart the server
```

**Problem:** Bedrock requests are failing

**Solutions:**
1. Verify API key is correct
2. Check AWS Bedrock service status
3. Ensure your AWS account has Bedrock access enabled
4. Check server logs for detailed error messages

**Problem:** Application not defaulting to Bedrock

**Solutions:**
1. Clear browser localStorage: `localStorage.clear()`
2. Hard refresh the page (Ctrl+Shift+R)
3. Check browser console for errors
4. Verify the `bedrock` environment variable is set on server

## Example curl Request

Test your Bedrock API key directly:

```bash
curl -X POST "https://bedrock-runtime.us-east-1.amazonaws.com/model/us.anthropic.claude-sonnet-4-5-20250929-v1:0/converse" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${bedrock}" \
  -d '{
    "messages": [
        {
            "role": "user",
            "content": [{"text": "Hello, how are you?"}]
        }
    ]
  }'
```

Expected response:
```json
{
  "output": {
    "message": {
      "content": [
        {
          "text": "I'm doing well, thank you for asking! ..."
        }
      ]
    }
  }
}
```

## Benefits of Bedrock as Default

### For End Users:
- ✨ No configuration required
- 🚀 Instant access to AI features
- 💰 No cost concerns
- 🔒 Privacy - no personal API keys needed

### For Administrators:
- 📊 Centralized cost management
- 🔐 Better security (single API key)
- 📈 Usage monitoring and control
- ⚡ Easier deployment

## Need Help?

Check the detailed implementation guide: `doc/BEDROCK-IMPLEMENTATION.md`

