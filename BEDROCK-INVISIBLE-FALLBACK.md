# AWS Bedrock - Invisible Fallback System

## 🎯 Visual Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        USER OPENS APP                        │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              PROVIDER SELECTION SCREEN (UI)                  │
│                                                              │
│  [Anthropic] [OpenAI] [Gemini] [OpenRouter]                │
│     ✓ Active                                                │
│                                                              │
│  ❌ NO "Bedrock" button visible                            │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
                    User selects: Anthropic
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    TWO SCENARIOS                             │
└──────────────────────┬───────────────────┬───────────────────┘
                       │                   │
          ┌────────────▼────────┐    ┌────▼──────────────┐
          │  Has API Key        │    │  No API Key       │
          └────────────┬────────┘    └────┬──────────────┘
                       │                   │
                       ▼                   ▼
         ┌──────────────────────┐  ┌──────────────────────┐
         │ Frontend sends:      │  │ Frontend sends:      │
         │ provider: anthropic  │  │ provider: anthropic  │
         │ apiKey: "sk-ant-..." │  │ apiKey: ""           │
         └──────────┬───────────┘  └──────────┬───────────┘
                    │                          │
                    ▼                          ▼
         ┌──────────────────────┐  ┌──────────────────────┐
         │ Backend receives:    │  │ Backend receives:    │
         │ apiKey is present ✓  │  │ apiKey is empty ✗    │
         └──────────┬───────────┘  └──────────┬───────────┘
                    │                          │
                    ▼                          ▼
         ┌──────────────────────┐  ┌──────────────────────┐
         │ Uses Anthropic API   │  │ Switches to:         │
         │ with user's key      │  │ provider = "bedrock" │
         │                      │  │ apiKey = env.bedrock │
         └──────────┬───────────┘  └──────────┬───────────┘
                    │                          │
                    │                          │
                    └───────────┬──────────────┘
                                │
                                ▼
                 ┌──────────────────────────┐
                 │   PRESENTATION CREATED   │
                 │   ✅ Works seamlessly!  │
                 └──────────────────────────┘
                                │
                                ▼
                 ┌──────────────────────────┐
                 │  User sees success       │
                 │  ❌ Never knows which    │
                 │     backend was used     │
                 └──────────────────────────┘
```

---

## 🔍 What Users See vs Reality

### User's Perspective:

```
┌───────────────────────────────────┐
│  What User Sees in UI             │
├───────────────────────────────────┤
│  ● Anthropic                      │
│  ○ OpenAI                         │
│  ○ Gemini                         │
│  ○ OpenRouter                     │
└───────────────────────────────────┘
     │
     │ User thinks: "I'm using Anthropic"
     ▼
  ✅ Presentation generated!
```

### What Actually Happens (No API Key):

```
┌───────────────────────────────────┐
│  Backend Reality                  │
├───────────────────────────────────┤
│  Request: provider="anthropic"    │
│           apiKey=""               │
│                                   │
│  Backend logic:                   │
│  if (apiKey === "") {             │
│    provider = "bedrock"           │
│    apiKey = process.env.bedrock   │
│  }                                │
│                                   │
│  Actual provider: BEDROCK         │
│  Actual key: server env var       │
└───────────────────────────────────┘
     │
     │ User is oblivious - it just works!
     ▼
  ✅ Presentation generated!
```

---

## 📋 Configuration Matrix

| User Action | Frontend Sends | Backend Uses | User Sees |
|-------------|---------------|--------------|-----------|
| No API key configured | `provider: "anthropic"` `apiKey: ""` | **Bedrock** (env var) | Success! |
| Anthropic key entered | `provider: "anthropic"` `apiKey: "sk-ant-..."` | **Anthropic** (user key) | Success! |
| OpenAI key entered | `provider: "openai"` `apiKey: "sk-..."` | **OpenAI** (user key) | Success! |
| Invalid/expired key | `provider: "anthropic"` `apiKey: "invalid"` | Anthropic returns error, falls back to **Bedrock** | Success! |

---

## 🎨 UI Comparison

### ❌ OLD Implementation (Visible Bedrock):

```
┌─────────────────────────────────────────┐
│  Content Generation Provider            │
├─────────────────────────────────────────┤
│  [🔒 Bedrock - FREE]  ← User sees this  │
│  [Anthropic]                            │
│  [OpenAI]                               │
│  [Gemini]                               │
│  [OpenRouter]                           │
└─────────────────────────────────────────┘

Problem: Users might be confused about what Bedrock is
```

### ✅ NEW Implementation (Invisible Bedrock):

```
┌─────────────────────────────────────────┐
│  Content Generation Provider            │
├─────────────────────────────────────────┤
│  [Anthropic]  ← Default selected         │
│  [OpenAI]                               │
│  [Gemini]                               │
│  [OpenRouter]                           │
└─────────────────────────────────────────┘

Bedrock is used behind the scenes when needed
Clean, simple UI - users just see standard providers
```

---

## 🔄 Automatic Failover Flow

```
User's Anthropic Key Expires
         │
         ▼
┌─────────────────────────┐
│ Frontend:               │
│ "Try using this key"    │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Backend:                │
│ "Key is invalid"        │
│ "Switching to Bedrock"  │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Bedrock:                │
│ "I got this!"           │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ User:                   │
│ "Hmm, it still works!"  │
│ "Maybe I didn't need    │
│  to update my key yet"  │
└─────────────────────────┘
```

---

## 🛠️ Admin Configuration

### One-Time Setup:

```bash
# Set environment variable (choose one method)

# Method 1: .env file
echo "bedrock=your-api-key-here" > .env

# Method 2: Export (temporary)
export bedrock=your-api-key-here

# Method 3: Docker
docker run -e bedrock=your-api-key-here app

# Method 4: Cloud Platform
# Set in Railway/Heroku/Vercel dashboard
```

### That's It! 

Users can now:
- ✅ Generate presentations without any configuration
- ✅ Use their own API keys if they want
- ✅ Experience seamless failover if keys fail
- ✅ Never worry about backend details

---

## 📊 Cost Management

### With Invisible Bedrock:

```
┌────────────────────────────────────────┐
│  All Usage Flows Through Your         │
│  Single Bedrock Account                │
├────────────────────────────────────────┤
│  User A (no API key)    → Bedrock     │
│  User B (no API key)    → Bedrock     │
│  User C (has own key)   → Their API   │
│  User D (expired key)   → Bedrock     │
└────────────────────────────────────────┘
            │
            ▼
┌────────────────────────────────────────┐
│  Single AWS Bill                       │
│  Easy to track and budget              │
│  No user cost concerns                 │
└────────────────────────────────────────┘
```

---

## 🎯 Key Takeaways

1. **Invisible to Users**
   - Bedrock is never shown in UI
   - Users only see: Anthropic, OpenAI, Gemini, OpenRouter
   - Seamless fallback happens behind the scenes

2. **Zero Configuration**
   - Users can start immediately
   - No API key required to get started
   - Optional: add their own keys later

3. **Automatic Failover**
   - If user's key is missing → Bedrock
   - If user's key is invalid → Bedrock  
   - If user's key expires → Bedrock
   - Always works!

4. **Admin Control**
   - One environment variable: `bedrock`
   - Server-side only
   - Never exposed to clients

5. **Clean Separation**
   - Frontend: "I want to use Anthropic"
   - Backend: "Let me handle that for you"
   - User: "It just works!"

---

## ✨ The Magic

**Users think:** "I'm using Anthropic/OpenAI/Gemini"  
**Reality:** Backend intelligently uses Bedrock when needed  
**Result:** Everyone happy! 🎉

No confusion. No complexity. Just works.™

