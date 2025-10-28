# Auth0 Integration Setup

## Changes Made

### 1. Package Dependencies
- Added `express-openid-connect` to `package.json`

### 2. Login Button
- Added login button to the HTML (positioned exactly on the left of "100% FREE" badge)
- Button automatically switches between "Login" and "Logout" based on authentication state

### 3. Server Configuration
- Integrated Auth0 with `express-openid-connect` in `server.js`
- Configured with your Auth0 credentials:
  - Client ID: `N9YYsWNFFnMjz7bHy0i70usqjP1HJRO9`
  - Issuer: `https://dev-cmf6hmnjvaezfw1g.us.auth0.com`
  - Base URL: `https://genis.ai`

### 4. Styling
- Added `.login-btn` CSS class with gradient purple design matching the brand colors
- Button matches the height and style of the "100% FREE" badge

## Setup Instructions

### 1. Install Dependencies
Run the following command:
```bash
npm install
```

### 2. Environment Variables
You need to set the following environment variables:

**Generate a secret key:**
```bash
openssl rand -hex 32
```

**Add to your `.env` file or environment:**
```bash
AUTH0_SECRET=<generated-secret-from-above>
AUTH0_BASE_URL=https://genis.ai
```

### 3. Auth0 Dashboard Configuration

In your Auth0 dashboard, make sure:

1. **Allowed Callback URLs:**
   - `https://genis.ai/callback`

2. **Allowed Logout URLs:**
   - `https://genis.ai`

3. **Application Settings:**
   - Verify Client ID matches: `N9YYsWNFFnMjz7bHy0i70usqjP1HJRO9`

### 4. Test the Integration

1. Start the server: `npm start`
2. Visit the homepage
3. Click the "🔐 Login" button
4. You should be redirected to Auth0 login
5. After login, the button should change to "🔓 Logout"

## How It Works

- **Login Button** is displayed in the header, to the left of the "100% FREE" badge
- The button automatically checks authentication state on page load
- `/login` route handles the Auth0 login flow
- `/logout` route handles the logout flow  
- `/api/user` endpoint returns current authentication state

## API Endpoints

- `GET /login` - Initiates Auth0 login
- `GET /logout` - Logs out the user
- `GET /callback` - Auth0 callback endpoint
- `GET /api/user` - Returns current user authentication state

## Security Notes

⚠️ **Important:** Make sure to:
1. Use a strong, randomly-generated `AUTH0_SECRET`
2. Add proper `.env` file handling (not committed to git)
3. Set proper CORS and security headers in production
4. Configure allowed callback/logout URLs in Auth0 dashboard

## Next Steps

After login is working, you can:
- Protect specific routes with `authRequired: true`
- Access user info via `req.oidc.user` in your endpoints
- Store user preferences based on Auth0 user ID

---

## Railway Deployment

### Generated Secret Key
Your Auth0 secret has been generated and saved to `AUTH0-RAILWAY-ENV.txt`.

### Railway Environment Variables to Add
1. Go to your Railway project settings
2. Add these environment variables:
   - `AUTH0_SECRET=41c415c9213a9e8725c007a1d1f65a90b4032462823eae7d3df7b3526b597095`
   - `AUTH0_BASE_URL=https://genis.ai`

### Railway Will Automatically:
- Install `express-openid-connect` during Docker build (no manual npm install needed)
- Rebuild and deploy with Auth0 integration enabled

