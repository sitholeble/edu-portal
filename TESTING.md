# Testing Keycloak Login

## Prerequisites

1. **Keycloak Server Running**
   ```bash
   npm run keycloak:start
   ```
   Wait for Keycloak to be ready (about 30-60 seconds). Check logs:
   ```bash
   npm run keycloak:logs
   ```

2. **Configure Keycloak Client**
   
   Access admin console: http://localhost:8181/admin
   - Username: `admin`
   - Password: `admin`
   
   Steps:
   1. Go to **Clients** → **Create client**
   2. **Client ID**: `edu-portal-client`
   3. **Client authentication**: OFF (public client)
   4. Click **Next**
   5. **Valid redirect URIs**: 
      - `exp://127.0.0.1:8081`
      - `exp://localhost:8081`
      - `eduportal://*`
   6. **Web origins**: `*`
   7. **Standard flow**: Enabled ✓
   8. **Direct access grants**: Enabled ✓
   9. Click **Save**

3. **Create a Test User** (if needed)
   
   In Keycloak admin console:
   1. Go to **Users** → **Create new user**
   2. Fill in username, email, first name, last name
   3. Go to **Credentials** tab → Set password
   4. Turn OFF "Temporary" if you want permanent password
   5. Click **Save**

## Testing Steps

### 1. Start the Expo App

```bash
npm start
```

Then press:
- `i` for iOS simulator
- `a` for Android emulator  
- `w` for web browser
- Or scan QR code with Expo Go app

### 2. Test Login Flow

**Expected Behavior:**

1. **Initial State**: App should show login screen with "Sign in with Keycloak" button
2. **Click Login Button**: 
   - Browser/webview should open with Keycloak login page
   - URL should be: `http://localhost:8181/realms/master/protocol/openid-connect/auth?...`
3. **Enter Credentials**:
   - Enter your Keycloak username and password
   - Click "Sign In"
4. **After Login**:
   - Browser should close automatically
   - App should redirect to home screen (tabs)
   - Home screen should show:
     - "Signed in as: [your-email-or-username]"
     - A "Sign Out" button

### 3. Verify Login Success

**Visual Indicators:**
- ✅ Login screen disappears
- ✅ Home screen shows user information
- ✅ "Sign Out" button is visible
- ✅ No error alerts appear

**Check Console/Logs:**
- Open React Native debugger or check terminal
- Look for successful authentication messages
- No error messages should appear

### 4. Test Logout

1. Click "Sign Out" button on home screen
2. Confirm logout in alert dialog
3. **Expected**: App redirects back to login screen

### 5. Test Token Persistence

1. Login successfully
2. Close and reopen the app
3. **Expected**: User should remain logged in (no redirect to login)

## Troubleshooting

### Issue: "Invalid redirect URI"
- **Solution**: Make sure redirect URIs in Keycloak client match exactly:
  - `exp://127.0.0.1:8081`
  - `exp://localhost:8081`

### Issue: "Client not found"
- **Solution**: Verify client ID is `edu-portal-client` in Keycloak

### Issue: Login page doesn't open
- **Solution**: 
  - Check Keycloak is running: `npm run keycloak:logs`
  - Verify URL in `constants/keycloak.ts` is `http://localhost:8181`

### Issue: Login succeeds but app doesn't redirect
- **Solution**: Check browser console for errors, verify redirect URI configuration

### Issue: "Network request failed"
- **Solution**: 
  - Ensure Keycloak is accessible at http://localhost:8181
  - Check firewall/network settings
  - For mobile devices, use your computer's IP address instead of localhost

## Debug Mode

To see detailed authentication logs, check the browser console (web) or React Native debugger (mobile) when testing the login flow.

