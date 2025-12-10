# Welcome to your Expo app

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Keycloak OAuth Setup

This app uses Keycloak for authentication. The configuration is already set up for local development.

### Quick Start with Docker

1. **Start Keycloak Server**
   
   Using Docker Compose (recommended):
   ```bash
   npm run keycloak:start
   # Or manually:
   docker-compose up -d keycloak
   ```
   
   Or using Docker directly:
   ```bash
   docker run -p 8181:8080 -e KEYCLOAK_ADMIN=admin -e KEYCLOAK_ADMIN_PASSWORD=admin quay.io/keycloak/keycloak:latest start-dev
   ```

2. **Access Keycloak Admin Console**
   
   - URL: http://localhost:8181/admin
   - Username: `admin`
   - Password: `admin`

3. **Configure Keycloak Client**
   
   In the Keycloak admin console:
   - Navigate to: **Clients** → **Create client** (or use existing `account` client)
   - **Client ID**: `edu-portal-client`
   - **Client authentication**: OFF (public client for mobile apps)
   - **Valid redirect URIs** (add ALL of these, one per line):
     - `http://localhost:8081`  **Required for web browser**
     - `exp://127.0.0.1:8081`
     - `exp://localhost:8081`
     - `exp://192.168.1.54:8081`  **Required for mobile devices** (use your computer's IP)
     - `eduportal://*`
   - **Web origins**  **CRITICAL for CORS** (add ALL of these, one per line):
     - `http://localhost:8081`
     - `http://192.168.1.54:8181` (Keycloak server)
     - `http://192.168.1.54:8081` (Expo server)
     - `*` (wildcard - allows all origins)
   - **Standard flow**: Enabled 
   - **Direct access grants**: Enabled  (for testing)
   
   **Note**: 
   - For **web browser**: Uses `http://localhost:8081` as redirect URI
   - For **mobile devices**: `localhost` doesn't work. The app automatically uses your computer's IP address (`192.168.1.54` by default). Update `KEYCLOAK_HOST_IP` in `constants/keycloak.ts` if your IP changes.

4. **Test Authentication**
   
   ```bash
   # Start the Expo app
   npm start
   ```
   
   The app will redirect to the login screen. Click "Sign in with Keycloak" to test the OAuth flow.

### Keycloak Management Commands

- Start Keycloak: `npm run keycloak:start`
- Stop Keycloak: `npm run keycloak:stop`
- View logs: `npm run keycloak:logs`
- Restart Keycloak: `npm run keycloak:restart`

### Configuration

The Keycloak configuration is in `constants/keycloak.ts`:
- **URL**: `http://localhost:8181` (default)
- **Realm**: `master` (default)
- **Client ID**: `edu-portal-client`

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
