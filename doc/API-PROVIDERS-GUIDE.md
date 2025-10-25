# Multi-Provider AI Support Guide

## Overview

The AI Text2PPT Pro application now supports **4 different AI providers**, giving you flexibility in choosing which AI model to use for generating your presentations.

## Supported Providers

### 1. Anthropic Claude 🤖

**Model:** `claude-sonnet-4-20250514`

**Get Your API Key:**
1. Visit [console.anthropic.com](https://console.anthropic.com/)
2. Sign up or log in
3. Navigate to "API Keys" section
4. Click "Create Key"
5. Copy your key (starts with `sk-ant-api03-`)

**Key Format:** `sk-ant-api03-xxxxxxxxxxxxx...`

**Pricing:** Pay-as-you-go
- Input: ~$3 per million tokens
- Output: ~$15 per million tokens

**Best For:**
- Complex reasoning
- Detailed content generation
- Professional presentations
- High-quality writing

---

### 2. OpenAI GPT-4o 🧠

**Model:** `gpt-4o`

**Get Your API Key:**
1. Visit [platform.openai.com](https://platform.openai.com/)
2. Sign up or log in
3. Click on "API keys" in left sidebar
4. Click "Create new secret key"
5. Copy your key (starts with `sk-`)

**Key Format:** `sk-xxxxxxxxxxxxx...`

**Pricing:** Pay-as-you-go
- Input: ~$2.50 per million tokens
- Output: ~$10 per million tokens

**Best For:**
- Fast responses
- Creative content
- Wide knowledge base
- Consistent formatting

**Note:** Requires billing setup and credits in your account

---

### 3. Google Gemini 💎

**Model:** `gemini-1.5-pro`

**Get Your API Key:**
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with Google account
3. Click "Create API Key"
4. Select or create a Google Cloud project
5. Copy your key (starts with `AIza`)

**Key Format:** `AIzaxxxxxxxxxxxxx...`

**Pricing:** 
- Free tier: 60 requests per minute
- Paid: ~$1.25-$5 per million tokens

**Best For:**
- Cost-effective solution
- Long context handling
- Multimodal capabilities
- Integration with Google services

**Note:** Free tier available for testing!

---

### 4. OpenRouter 🚀

**Model:** `anthropic/claude-3.5-sonnet` (and many others)

**Get Your API Key:**
1. Visit [openrouter.ai](https://openrouter.ai/)
2. Sign up or log in
3. Navigate to "Keys" section
4. Click "Create Key"
5. Copy your key (starts with `sk-or-`)

**Key Format:** `sk-or-xxxxxxxxxxxxx...`

**Pricing:** Variable by model
- Claude 3.5 Sonnet: ~$3-$15 per million tokens
- Access to 100+ different models
- Unified API for multiple providers

**Best For:**
- Trying different models
- Cost comparison
- Access to multiple AI providers
- Fallback options

**Note:** Requires credits in your account

---

## How to Use

### Quick Start

1. **Open the Application**
   ```
   Navigate to http://localhost:3000
   ```

2. **Select Your Provider**
   - Click on the API Configuration section
   - Choose from: Anthropic, OpenAI, Gemini, or OpenRouter
   - The selected button will be highlighted

3. **Enter Your API Key**
   - Paste your API key in the input field
   - Click "Save Key"
   - Your key is stored locally (never sent to our servers)

4. **Create Your Presentation**
   - Enter your content or use AI prompt generator
   - Click "Preview Slides"
   - Click "Generate PowerPoint"

### Switching Providers

You can switch between providers at any time:

1. Click on a different provider button
2. Enter that provider's API key
3. Save the key
4. Generate presentations using the new provider

**Note:** Each provider's API key is saved separately, so you can switch back and forth without re-entering keys.

---

## Provider Comparison

| Feature | Anthropic | OpenAI | Gemini | OpenRouter |
|---------|-----------|--------|--------|------------|
| Free Tier | ❌ No | ❌ No | ✅ Yes | ❌ No |
| Quality | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Varies |
| Speed | Fast | Very Fast | Fast | Varies |
| Cost | Medium | Medium | Low | Varies |
| Context | 200K tokens | 128K tokens | 1M tokens | Varies |
| Best For | Professional | Creative | Cost-effective | Flexibility |

---

## Troubleshooting

### "Invalid API Key" Error

**For Anthropic:**
- Verify key starts with `sk-ant-api03-`
- Check key is not expired
- Ensure billing is set up

**For OpenAI:**
- Verify key starts with `sk-`
- Check you have credits
- Confirm billing is active

**For Gemini:**
- Verify key starts with `AIza`
- Check API is enabled in Google Cloud
- Verify project is active

**For OpenRouter:**
- Verify key starts with `sk-or-`
- Check you have credits
- Confirm account is active

### "Insufficient Credits" Error

**Solution:**
1. Log into provider's dashboard
2. Add payment method
3. Purchase credits
4. Wait a few minutes for activation

### "Rate Limit Exceeded" Error

**Solution:**
1. Wait a few minutes
2. Try again
3. Consider upgrading your plan
4. Switch to a different provider

### API Not Responding

**Check:**
1. Internet connection
2. API key is correct
3. Provider service status
4. Browser console for errors

---

## API Key Security

### ⚠️ Important Security Notes:

1. **Never share your API keys**
   - Keys are like passwords
   - Anyone with your key can use your account
   - You'll be charged for their usage

2. **Store keys securely**
   - Keys are stored in browser's localStorage
   - Clear localStorage on shared computers
   - Don't commit keys to version control

3. **Rotate keys regularly**
   - Generate new keys every few months
   - Delete old keys from provider dashboard
   - Update application with new keys

4. **Monitor usage**
   - Check provider dashboards regularly
   - Set up usage alerts
   - Review billing statements

### How to Clear Stored Keys

**Option 1: Through UI**
1. Delete the key from input field
2. Click "Save Key"

**Option 2: Browser Console**
```javascript
// Clear all stored data
localStorage.clear();

// Or clear specific provider
localStorage.removeItem('anthropic_api_key');
localStorage.removeItem('openai_api_key');
localStorage.removeItem('gemini_api_key');
localStorage.removeItem('openrouter_api_key');
```

---

## Cost Estimation

### Example: 10-slide Presentation

**Typical Usage:**
- Prompt generation: ~500 tokens
- Slide structure: ~2,000 tokens
- PPTX generation: ~3,000 tokens
- **Total:** ~5,500 tokens per presentation

**Cost per Presentation:**
- **Anthropic:** ~$0.08 - $0.15
- **OpenAI:** ~$0.05 - $0.10
- **Gemini:** ~$0.01 - $0.03 (or FREE with free tier)
- **OpenRouter:** ~$0.05 - $0.15

**For 100 Presentations:**
- **Anthropic:** ~$8 - $15
- **OpenAI:** ~$5 - $10
- **Gemini:** ~$1 - $3
- **OpenRouter:** ~$5 - $15

---

## Best Practices

### For Professional Use
✅ Use **Anthropic Claude** or **OpenAI GPT-4o**
- Highest quality output
- Best for business presentations
- Professional writing style

### For Cost-Conscious Users
✅ Use **Google Gemini**
- Free tier available
- Good quality
- Perfect for personal use

### For Experimentation
✅ Use **OpenRouter**
- Try different models
- Compare outputs
- Find best model for your needs

### For High Volume
✅ Consider multiple providers
- Distribute load
- Reduce rate limiting
- Compare costs

---

## FAQ

**Q: Can I use multiple providers at once?**
A: No, but you can switch between them anytime. Each provider's key is saved separately.

**Q: Which provider is best?**
A: Anthropic and OpenAI offer the highest quality. Gemini is great for cost savings. OpenRouter offers the most flexibility.

**Q: Do I need all API keys?**
A: No, just one is enough. Choose the provider that fits your needs.

**Q: Are my API keys safe?**
A: Keys are stored locally in your browser. They're never sent to our servers, only to the AI provider you selected.

**Q: Can I get a refund if I don't like the results?**
A: API usage is charged by the providers directly. Contact them for refund policies.

**Q: Why did my API call fail?**
A: Check: 1) API key is correct, 2) You have credits, 3) Service is not down, 4) Check browser console for errors.

**Q: Can I use this commercially?**
A: Yes, but check each provider's terms of service. Most allow commercial use.

**Q: How do I cancel/delete my account with a provider?**
A: Log into the provider's dashboard and follow their account deletion process.

---

## Getting Started Checklist

- [ ] Choose an AI provider
- [ ] Create account with provider
- [ ] Get API key
- [ ] Enter key in application
- [ ] Save key
- [ ] Test with example content
- [ ] Create your first presentation
- [ ] Download and verify PPTX
- [ ] Set up usage alerts (optional)
- [ ] Add payment method for continued use

---

## Support & Resources

### Provider Documentation:
- **Anthropic:** [docs.anthropic.com](https://docs.anthropic.com)
- **OpenAI:** [platform.openai.com/docs](https://platform.openai.com/docs)
- **Gemini:** [ai.google.dev](https://ai.google.dev)
- **OpenRouter:** [openrouter.ai/docs](https://openrouter.ai/docs)

### Common Issues:
- Check `TESTING-GUIDE.md` for testing procedures
- See `BEFORE-AFTER-COMPARISON.md` for feature overview
- Review `MULTI-PROVIDER-UPDATE.md` for technical details

---

## Updates & Changelog

### Version 2.0 (Current)
- ✅ Added multi-provider support
- ✅ Fixed AI prompt obedience issue
- ✅ Added collapsible API section
- ✅ Improved error handling
- ✅ Better user experience

### Future Enhancements
- [ ] Model selection within each provider
- [ ] Cost tracking dashboard
- [ ] Batch processing
- [ ] Template library
- [ ] Custom themes
- [ ] More AI providers (Cohere, Mistral, etc.)

---

**Need Help?**
- Check browser console for errors
- Review testing guide
- Verify API key is correct
- Check provider service status
- Try a different provider

