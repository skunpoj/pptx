# Auth0 Login Redirect Troubleshooting

## Issue
Login button not redirecting to Auth0's social sign-in page.

## Server-Side Configuration (Already Fixed)

The server configuration has been updated with:
1. ✅ Explicit authorization parameters
2. ✅ Proper callback URL configuration
3. ✅ Enhanced logging for debugging

## Auth0 Dashboard Configuration Checklist

### 1. Application Settings
Go to Auth0 Dashboard → Applications → Your Application

**Verify these settings:**

- **Application Type**: Must be set to **"Regular Web Application"**
- **Client ID**: `N9YYsWNFFnMjz7bHy0i70usqjP1HJRO9`
- **Domain**: `dev-cmf6hmnjvaezfw1g.us.auth0.com`

### 2. Allowed Callback URLs
Must include:
```
https://genis.ai/callback
```

For local testing, also add:
```
http://localhost:3000/callback
```

### 3. Allowed Logout URLs
Must include:
```
https://genis.ai
```

For local testing, also add:
```
http://localhost:3000
```

### 4. Allowed Web Origins
Should include:
```
https://genis.ai
```

### 5. Enable Social Connections

Go to Auth0 Dashboard → Authentication → Social

1. Enable desired social providers (Google, Facebook, etc.)
2. Configure each provider with their respective credentials
3. Make sure social connections are enabled for your application

### 6. Universal Login Configuration

Go to Auth0 Dashboard → Branding → Universal Login

1. Ensure **Universal Login** is enabled (not Classic)
2. Universal Login automatically shows social login options
3. If using Classic, you need to manually configure the login page

### 7. Application Grant Types

In Application Settings → Advanced Settings → Grant Types, ensure:
- ✅ Authorization Code
- ✅ Refresh Token

PKCE should be enabled for security.

## Testing Steps

1. **Check server logs** when clicking login:
   - Should see: "Login route accessed" (if debugging is enabled)
   - Should redirect to Auth0

2. **Test the login URL directly**:
   - Visit: `https://genis.ai/login`
   - Should redirect to Auth0's login page

3. **Check browser console**:
   - Look for any JavaScript errors
   - Check Network tab for redirect responses

4. **Verify Auth0 response**:
   - Should redirect to: `https://dev-cmf6hmnjvaezfw1g.us.auth0.com/authorize?...`
   - Should show social login options

## Common Issues

### Issue 1: Application Type is Wrong
**Problem**: Application is set to "Single Page Application" instead of "Regular Web Application"
**Solution**: Change application type in Auth0 Dashboard

### Issue 2: Callback URL Not Allowed
**Problem**: Callback URL is not in the allowed list
**Solution**: Add `https://genis.ai/callback` to allowed callback URLs

### Issue 3: PKCE Not Enabled
**Problem**: PKCE might be required but not configured
**Solution**: Enable PKCE in Advanced Settings (usually enabled by default for Regular Web Apps)

### Issue 4: Social Connections Not Enabled
**Problem**: Social login providers not configured
**Solution**: Enable and configure social connections in Auth0 Dashboard

## Code Changes Made

1. Added `authorizationParams` to Auth0 config
2. Added explicit authorization parameters (`response_type: 'code'`, `scope: 'openid profile email'`)
3. Enhanced logging for debugging
4. Removed any conflicting route handlers

## Next Steps

1. Verify all Auth0 dashboard settings above
2. Test the login flow
3. Check server logs for any errors
4. If still not working, check Auth0 Dashboard → Monitoring → Logs for authentication attempts

