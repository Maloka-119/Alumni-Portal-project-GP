# LinkedIn OAuth Testing Guide for Postman

## Prerequisites

Before testing, make sure you have:

1. **LinkedIn App Credentials**:
   - `LINKEDIN_CLIENT_ID` - Your LinkedIn app Client ID
   - `LINKEDIN_CLIENT_SECRET` - Your LinkedIn app Client Secret
   - `LINKEDIN_REDIRECT_URI` - Must match the one in your LinkedIn app settings (e.g., `http://localhost:3000/auth/linkedin/callback`)

2. **Environment Variables** in your `.env` file:
   ```
   LINKEDIN_CLIENT_ID=your_client_id_here
   LINKEDIN_CLIENT_SECRET=your_client_secret_here
   LINKEDIN_REDIRECT_URI=http://localhost:3000/auth/linkedin/callback
   SESSION_SECRET=your_session_secret_key
   ```

3. **LinkedIn App Configuration**:
   - Go to [LinkedIn Developers](https://www.linkedin.com/developers/apps)
   - Create or select your app
   - Add authorized redirect URL: `http://localhost:3000/auth/linkedin/callback`
   - Request these scopes: `r_liteprofile`, `r_emailaddress`

---

## Step-by-Step Testing Guide

### **Step 1: Get the Authorization URL**

**Request in Postman:**

1. **Method**: `GET`
2. **URL**: `http://localhost:5005/alumni-portal/auth/linkedin`
3. **Headers**: None required
4. **Body**: None

**Expected Response:**
```json
{
  "status": "success",
  "data": {
    "authUrl": "https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=...&redirect_uri=...&state=...&scope=r_liteprofile%20r_emailaddress",
    "state": "abc123xyz"
  }
}
```

**Important**: 
- Copy the `authUrl` from the response
- **Save the `state` value** - you'll need it for Step 3
- The session cookie will be set automatically (check Postman's Cookies tab)

---

### **Step 2: Authorize in Browser**

**This step must be done in a browser (not Postman):**

1. **Open a browser** (Chrome, Firefox, etc.)
2. **Paste the `authUrl`** you copied from Step 1 into the address bar
3. **Press Enter** - You'll be redirected to LinkedIn
4. **Log in to LinkedIn** (if not already logged in)
5. **Click "Allow"** to authorize the app
6. **You'll be redirected** to your callback URL with a code parameter

**Example redirect URL:**
```
http://localhost:3000/auth/linkedin/callback?code=AUTHORIZATION_CODE_HERE&state=abc123xyz
```

**Important**: 
- Copy the entire URL from the browser's address bar
- Extract the `code` parameter value
- Make sure the `state` matches the one from Step 1

---

### **Step 3: Test the Callback Endpoint**

**Request in Postman:**

1. **Method**: `GET`
2. **URL**: `http://localhost:5005/alumni-portal/auth/linkedin/callback`
3. **Query Parameters**:
   - `code`: Paste the authorization code from Step 2
   - `state`: Paste the state value from Step 1
   
   Example:
   ```
   http://localhost:5005/alumni-portal/auth/linkedin/callback?code=AUTHORIZATION_CODE&state=abc123xyz
   ```

4. **Headers**: 
   - Make sure to include the session cookie from Step 1
   - In Postman: Go to **Cookies** tab and ensure the session cookie is included

5. **Body**: None

**Expected Response (Success):**
```json
{
  "status": "success",
  "message": "LinkedIn authentication successful",
  "data": {
    "user": {
      "id": 123,
      "first-name": "John",
      "last-name": "Doe",
      "email": "john.doe@example.com",
      "user-type": "graduate",
      "profile_picture_url": "https://...",
      "linkedin_profile_url": "https://www.linkedin.com/in/...",
      "linkedin_headline": "Software Engineer",
      "linkedin_location": "New York, NY",
      "auth_provider": "linkedin",
      "is_linkedin_verified": true
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Save the `token`** - You'll need it for testing protected endpoints!

---

## Alternative: Testing with Postman's OAuth 2.0 Helper

Postman has a built-in OAuth 2.0 helper that can simplify this process:

### **Setup OAuth 2.0 in Postman:**

1. **Create a new request** in Postman
2. **Go to the "Authorization" tab**
3. **Select "OAuth 2.0"** from the Type dropdown
4. **Fill in the details**:
   - **Grant Type**: `Authorization Code`
   - **Callback URL**: `http://localhost:3000/auth/linkedin/callback`
   - **Auth URL**: `https://www.linkedin.com/oauth/v2/authorization`
   - **Access Token URL**: `https://www.linkedin.com/oauth/v2/accessToken`
   - **Client ID**: Your LinkedIn Client ID
   - **Client Secret**: Your LinkedIn Client Secret
   - **Scope**: `r_liteprofile r_emailaddress`
   - **State**: Leave empty or generate a random string

5. **Click "Get New Access Token"**
6. **Authorize in the popup window**
7. **Use the token** for subsequent requests

**Note**: This method gets the LinkedIn access token directly, but you still need to test your backend callback endpoint separately.

---

## Testing Other LinkedIn Endpoints

### **Get LinkedIn Profile** (Protected)

**Request:**
- **Method**: `GET`
- **URL**: `http://localhost:5005/alumni-portal/auth/linkedin/profile`
- **Headers**: 
  ```
  Authorization: Bearer YOUR_JWT_TOKEN_FROM_STEP_3
  ```

**Expected Response:**
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": 123,
      "first-name": "John",
      "last-name": "Doe",
      "email": "john.doe@example.com",
      "user-type": "graduate",
      "profile_picture_url": "https://...",
      "linkedin_profile_url": "https://www.linkedin.com/in/...",
      "linkedin_headline": "Software Engineer",
      "linkedin_location": "New York, NY",
      "auth_provider": "linkedin",
      "is_linkedin_verified": true,
      "token_expires_at": "2024-01-27T12:00:00.000Z"
    }
  }
}
```

---

### **Refresh LinkedIn Token** (Protected)

**Request:**
- **Method**: `POST`
- **URL**: `http://localhost:5005/alumni-portal/auth/linkedin/refresh`
- **Headers**: 
  ```
  Authorization: Bearer YOUR_JWT_TOKEN_FROM_STEP_3
  ```
- **Body**: None

**Expected Response:**
```json
{
  "status": "success",
  "message": "LinkedIn token refreshed successfully"
}
```

---

### **Disconnect LinkedIn Account** (Protected)

**Request:**
- **Method**: `DELETE`
- **URL**: `http://localhost:5005/alumni-portal/auth/linkedin/disconnect`
- **Headers**: 
  ```
  Authorization: Bearer YOUR_JWT_TOKEN_FROM_STEP_3
  ```
- **Body**: None

**Expected Response:**
```json
{
  "status": "success",
  "message": "LinkedIn account disconnected successfully"
}
```

---

## Troubleshooting

### **Issue: "Invalid state parameter"**

**Solution**: 
- Make sure you're using the same session cookie from Step 1
- The state must match exactly between Step 1 and Step 3
- Check Postman's Cookies tab to ensure the session is maintained

### **Issue: "Authorization code not provided"**

**Solution**:
- Make sure you copied the entire `code` parameter from the browser URL
- The code should be in the query parameters, not the path

### **Issue: "Could not retrieve email from LinkedIn"**

**Solution**:
- Make sure your LinkedIn app has the `r_emailaddress` scope
- Verify the scope is approved in your LinkedIn app settings
- The user must grant email permission during authorization

### **Issue: Session not maintained in Postman**

**Solution**:
1. Enable **"Send cookies"** in Postman settings
2. Use Postman's **Interceptor** or **Proxy** to capture cookies
3. Manually add the session cookie from Step 1 to Step 3

### **Issue: Redirect URI mismatch**

**Solution**:
- Ensure the redirect URI in your `.env` file matches exactly with the one in LinkedIn app settings
- No trailing slashes
- Must be `http://localhost:3000/auth/linkedin/callback` (not `http://localhost:5005/...`)

---

## Quick Test Checklist

- [ ] Step 1: Get authorization URL successfully
- [ ] Step 2: Authorize in browser and get code
- [ ] Step 3: Test callback endpoint with code and state
- [ ] Verify JWT token is returned
- [ ] Test protected endpoint with JWT token
- [ ] Test get profile endpoint
- [ ] Test refresh token endpoint (if refresh token is available)
- [ ] Test disconnect endpoint

---

## Notes

1. **Session Management**: The OAuth flow uses sessions to store the state parameter. Make sure Postman maintains cookies between requests.

2. **Authorization Code Expiry**: LinkedIn authorization codes expire quickly (usually within 10 minutes). If you get an error, start from Step 1 again.

3. **Testing in Production**: For production testing, update the redirect URI to your production URL and ensure it's added to your LinkedIn app settings.

4. **Multiple Users**: Each authorization code can only be used once. To test with a different user, start from Step 1 again.

---

## Example Postman Collection

You can create a Postman collection with these requests:

1. **Get LinkedIn Auth URL** - GET `/alumni-portal/auth/linkedin`
2. **LinkedIn Callback** - GET `/alumni-portal/auth/linkedin/callback?code={code}&state={state}`
3. **Get LinkedIn Profile** - GET `/alumni-portal/auth/linkedin/profile` (with Bearer token)
4. **Refresh Token** - POST `/alumni-portal/auth/linkedin/refresh` (with Bearer token)
5. **Disconnect** - DELETE `/alumni-portal/auth/linkedin/disconnect` (with Bearer token)

---

Good luck with your testing! 🚀

