# AWS Bedrock Setup Guide

## Quick Start

AWS Bedrock is now the **default LLM provider** for this application. Follow these steps to configure it:

### 1. Create Environment File

Create a `.env` file in the project root directory:

```bash
# .env file
bedrock=your-aws-bedrock-api-key-here
```

### 2. Get Your AWS Bedrock API Key

You can obtain your Bedrock API key from AWS. The application uses the Bedrock Converse API with Claude Sonnet 4.5.

**API Endpoint:**
```
https://bedrock-runtime.us-east-1.amazonaws.com/model/us.anthropic.claude-sonnet-4-5-20250929-v1:0/converse
```

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
2. Go to "Advanced Configuration"
3. You should see "AWS Bedrock" button with "FREE • Default" badge
4. Try generating a presentation without configuring any API keys
5. Check browser console - should show: "Using Bedrock provider (server-side authentication)"

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

1. **Default Behavior:**
   - When users open the app for the first time, Bedrock is automatically selected
   - No API key configuration required from users
   - All requests use the server-side `bedrock` environment variable

2. **Fallback Behavior:**
   - If a user selects another provider (Anthropic, OpenAI, etc.) but doesn't provide an API key
   - System automatically falls back to Bedrock
   - Ensures the application always works

3. **User Choice:**
   - Users can still configure their own API keys for other providers
   - When they do, those providers will be used instead of Bedrock
   - Gives users flexibility while maintaining zero-config default

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

