# Network Security Issue - Zscaler Blocking

## Problem
You're encountering this error when trying to generate PowerPoint presentations:

```
❌ Generation Error: <!--# Id: security.html... (Zscaler security page)
```

**This is NOT a code issue** - it's your organization's network security software blocking the service.

## What's Happening

1. **Zscaler Security Software** is intercepting your requests to `https://pptx.coder.garden/api/generate`
2. Instead of receiving the PowerPoint file, you're getting an HTML security warning page
3. The file is being quarantined for security analysis

## Why This Happens

Your organization (Bank of Thailand) uses Zscaler to protect against internet threats. When you try to download files from external services, Zscaler:
- Intercepts the download
- Scans the file for malware/threats
- Either allows it (if safe) or blocks it (if risky)

## Solutions

### Solution 1: Wait for Security Scan ⏱️

The Zscaler message says:
> "The analysis can take up to 10 minutes... If safe, your file downloads automatically."

**Steps:**
1. Wait 10-15 minutes after your first attempt
2. Try generating the presentation again
3. If the file is deemed safe, it should download automatically

### Solution 2: Request IT Whitelisting 📧

Contact your IT support team to whitelist the service:

**Email:** `serviced@bot.or.th`

**Request template:**
```
Subject: Request to Whitelist pptx.coder.garden

Dear IT Support Team,

I am using an AI-powered PowerPoint generation tool for work purposes. 
The domain pptx.coder.garden is being blocked by Zscaler.

Could you please whitelist this domain to allow PowerPoint file downloads?

URL being blocked: https://pptx.coder.garden/api/generate

Thank you,
[Your Name]
```

### Solution 3: Run Locally (RECOMMENDED) 💻

**Bypass network restrictions by running the server on your local machine:**

#### Quick Start - Local Setup

1. **Make sure you have Node.js installed**
   ```powershell
   node --version
   # Should show v18 or higher
   ```

2. **Install dependencies** (if not already done)
   ```powershell
   npm install
   ```

3. **Start the local server**
   ```powershell
   npm start
   ```

4. **Open in browser**
   ```
   http://localhost:3000
   ```

5. **Generate presentations**
   - All processing happens on YOUR computer
   - No external API calls for file generation
   - Only API calls are to AI providers (Anthropic, OpenAI, etc.)

#### Benefits of Local Setup
- ✅ **No network blocking** - Files generated on your machine
- ✅ **Faster** - No network latency
- ✅ **More private** - Your data stays on your computer
- ✅ **Works offline** - Except for AI API calls

## Technical Details

The error occurs because:

1. Our application sends a POST request to `/api/generate`
2. Zscaler intercepts the response
3. Instead of a PowerPoint file (binary data), we receive HTML
4. The application tries to parse it, causing the error you see

The fix I implemented earlier (for HTML comment parsing) actually helps here by providing better error messages, but it can't bypass your organization's security policies.

## Recommended Approach

**Use the local server (Solution 3)** because:
- It's the fastest and most reliable option
- You don't need IT approval
- All code is open source and safe
- You maintain full control over your data

## Files Involved
- None - this is a network/security policy issue, not a code issue

## Need Help?

If you choose the local setup and encounter any issues, I can help with:
- Installation problems
- Configuration
- Running the server
- Troubleshooting

Just let me know! 🚀

