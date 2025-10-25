# Chart Error Diagnosis Guide

## Error: `Unexpected token '<', "<!--# Id: "... is not valid JSON`

This error occurs when the server returns HTML instead of JSON. Here's how to diagnose it:

---

## Step 1: Check Browser Console

When you see this error, **immediately** open Browser DevTools:

1. Press **F12** (or Right-click → Inspect)
2. Go to **Console** tab
3. Look for messages like:
   ```
   Expected JSON but got: <!--# Id: ...
   ```
4. This will show you the FIRST 500 characters of what was returned

---

## Step 2: Check Network Tab

1. In DevTools, go to **Network** tab
2. Find the `/api/preview` request (might be red if failed)
3. Click on it
4. Go to **Response** tab
5. You'll see the actual HTML/error page being returned

---

## Step 3: Check Server Logs

Look at your server console (where you ran `node server.js`) for:

```
📊 Preview request received
  Content length: XXX characters
  Provider: anthropic
  Prompt generated, length: XXX
  AI response received, length: XXX
  AI response preview: {...
  Parsed successfully, slides: 6
  📈 Chart slides found: 2
    Chart 1: column - Quarterly Revenue Growth
    Chart 2: pie - Market Share Distribution
✅ Preview validation passed
```

If you see an error instead:
```
❌ Preview error: Failed to parse AI response
```

This tells you WHERE the problem is.

---

## Common Causes

### 1. AI Returned Invalid JSON
**Symptom:** Server logs show "JSON Parse Error"  
**Solution:** The AI's response wasn't valid JSON. Try again or adjust content.

### 2. Server Crashed/Timeout
**Symptom:** HTML error page like "502 Bad Gateway" or "<!--# Id: error-->"  
**Solution:** Server or proxy returned error page. Check server is running.

### 3. Reverse Proxy Error
**Symptom:** nginx/Apache error page with `<!--# SSI -->`  
**Solution:** If using reverse proxy, it returned error instead of proxying to Node.js

### 4. API Key Invalid
**Symptom:** 401 or 403 error from AI provider  
**Solution:** Check API key is correct and has credits

---

## Temporary Workaround

If charts keep failing, you can temporarily test WITHOUT charts:

1. Use the **💻 Tech** or **📚 Education** examples (no numerical data)
2. These won't trigger chart generation
3. If preview works WITHOUT charts, the issue is chart-specific

---

## Next Steps

**Please provide:**
1. What you see in Browser Console (the "Expected JSON but got:" message)
2. What you see in Server logs (the ❌ error line)
3. What example you clicked (Business, Marketing, Healthcare)
4. What AI provider you're using (Anthropic, OpenAI, etc.)

This will help pinpoint the exact issue!

