# AWS Bedrock - Quick Reference Card

## 🚀 Quick Start (30 seconds)

```bash
# 1. Create .env file
echo "bedrock=your-api-key-here" > .env

# 2. Start server
npm start

# 3. Done! Application now uses Bedrock by default
```

---

## 📋 Environment Variable

**Name:** `bedrock`  
**Value:** Your AWS Bedrock API key  
**Location:** `.env` file or deployment environment variables  

---

## 🔗 API Details

**Model:** Claude Sonnet 4.5  
**Endpoint:** `https://bedrock-runtime.us-east-1.amazonaws.com/model/us.anthropic.claude-sonnet-4-5-20250929-v1:0/converse`  
**Authentication:** `Authorization: Bearer ${bedrock}`  

---

## ✅ What Works

- ✅ Presentation generation without API keys
- ✅ Slide preview and incremental generation
- ✅ Slide modification
- ✅ Content generation
- ✅ File processing
- ✅ Template-based generation
- ✅ Automatic fallback when no user keys

---

## 🎯 User Experience

**First-time users:**
- See "AWS Bedrock" selected by default
- Can generate presentations immediately
- No configuration required

**Existing users:**
- Keep using their configured API keys
- Can switch to Bedrock anytime
- Automatic fallback if their key fails

---

## 🐳 Docker

```bash
# docker-compose.yml
environment:
  - bedrock=${BEDROCK_API_KEY}

# Run
docker-compose up
```

---

## ☁️ Cloud Deployment

**Railway / Heroku:**
```bash
# Set environment variable in dashboard
Variable: bedrock
Value: your-api-key-here
```

**Vercel / Netlify:**
```bash
# Environment Variables section
BEDROCK=your-api-key-here
```

---

## 🧪 Test It

```javascript
// In browser console:

// 1. Clear all API keys
localStorage.clear()

// 2. Reload page
location.reload()

// 3. Check current provider
console.log(window.currentProvider) // Should show "bedrock"

// 4. Generate a presentation
// Should work without asking for API key!
```

---

## 🔍 Verify Setup

**Backend (Server Logs):**
```
✅ Provider: bedrock
✅ Using environment variable for authentication
```

**Frontend (Browser Console):**
```
✅ Using Bedrock provider (server-side authentication)
💡 No API keys found, defaulting to Bedrock (FREE)
```

---

## ⚠️ Troubleshooting

**Issue:** "Bedrock API key not found"
```bash
# Check if environment variable is set
echo $bedrock

# If empty, set it
export bedrock=your-api-key-here
```

**Issue:** Not using Bedrock by default
```javascript
// Clear browser storage
localStorage.clear()
// Reload page
location.reload()
```

**Issue:** API requests failing
```bash
# Test API key directly
curl -X POST "https://bedrock-runtime.us-east-1.amazonaws.com/model/us.anthropic.claude-sonnet-4-5-20250929-v1:0/converse" \
  -H "Authorization: Bearer ${bedrock}" \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":[{"text":"Hello"}]}]}'
```

---

## 📁 Files Changed

**Backend:**
- `server/config/constants.js` - Added Bedrock config
- `server/utils/ai.js` - Added Bedrock API integration
- `server.js` - Updated 6 endpoints for Bedrock fallback

**Frontend:**
- `public/index.html` - Added Bedrock UI
- `public/js/app.js` - Set Bedrock as default
- `public/js/api/capabilities.js` - Handle Bedrock auth
- `public/js/api/slidePreview.js` - Send provider info

---

## 🎁 Benefits

| Aspect | Benefit |
|--------|---------|
| **Users** | No configuration required |
| **Admins** | Single API key to manage |
| **Cost** | Centralized billing |
| **Security** | Server-side authentication |
| **Privacy** | No user API keys needed |

---

## 📚 Documentation

- **Setup Guide:** `BEDROCK-SETUP.md`
- **Implementation Details:** `doc/BEDROCK-IMPLEMENTATION.md`
- **Full Changes List:** `doc/BEDROCK-CHANGES-SUMMARY.md`

---

## 🔒 Security

✅ API key stored server-side only  
✅ Never exposed to client  
✅ Environment variable storage  
✅ HTTPS required for all requests  

---

## 💡 Tips

1. **Rotate keys regularly** for security
2. **Monitor usage** in AWS console
3. **Set up billing alerts** to track costs
4. **Consider rate limiting** for high-traffic deployments
5. **Cache common requests** to reduce API calls

---

## 📞 Support

Check logs for detailed error messages:

**Server-side:**
```bash
# Look for these messages
⚠️ No API key provided, defaulting to Bedrock provider
✅ Using environment variable for authentication
```

**Client-side:**
```javascript
// Open browser console and look for
✅ Using Bedrock provider (server-side authentication)
💡 No API keys found, defaulting to Bedrock (FREE)
```

---

## ✨ That's It!

Bedrock is now your default AI provider. Users can start generating presentations immediately without any configuration!

