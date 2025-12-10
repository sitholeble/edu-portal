#!/bin/bash

# Keycloak Client Setup Verification Script

KEYCLOAK_URL="http://localhost:8181"
REALM="master"
CLIENT_ID="edu-portal-client"

echo "🔍 Checking Keycloak client configuration..."
echo ""

# Check if Keycloak is accessible
echo "1. Checking Keycloak accessibility..."
if curl -s -o /dev/null -w "%{http_code}" "$KEYCLOAK_URL" | grep -q "200\|302"; then
    echo "  Keycloak is accessible at $KEYCLOAK_URL"
else
    echo "  Keycloak is not accessible. Make sure it's running: npm run keycloak:start"
    exit 1
fi

echo ""
echo " Manual Setup Instructions:"
echo ""
echo "1. Open Keycloak Admin Console:"
echo "    $KEYCLOAK_URL/admin"
echo ""
echo "2. Login with:"
echo "   Username: admin"
echo "   Password: admin"
echo ""
echo "3. Create Client:"
echo "   - Go to: Clients → Create client"
echo "   - Client ID: $CLIENT_ID"
echo "   - Client authentication: OFF (public client)"
echo "   - Click 'Next'"
echo ""
echo "4. Configure Client Settings:"
echo "   - Valid redirect URIs (add ALL of these, one per line):"
echo "     • http://localhost:8081"
echo "     • exp://127.0.0.1:8081"
echo "     • exp://localhost:8081"
echo "     • exp://192.168.1.54:8081"
echo "     • eduportal://*"
echo ""
echo "   - Web origins (IMPORTANT for CORS - add ALL, one per line):"
echo "     • http://localhost:8081"
echo "     • http://192.168.1.54:8181"
echo "     • http://192.168.1.54:8081"
echo "     • *"
echo ""
echo "   - Standard flow: Enabled ✓"
echo "   - Direct access grants: Enabled ✓"
echo "   - Click 'Save'"
echo ""
echo "     CRITICAL: Web origins must include your IP address!"
echo "     This fixes the 'Cross-Site request validation' error."
echo ""
echo "5. Create Test User (optional):"
echo "   - Go to: Users → Create new user"
echo "   - Fill in username, email, first name, last name"
echo "   - Go to 'Credentials' tab → Set password"
echo "   - Turn OFF 'Temporary'"
echo "   - Click 'Save'"
echo ""
echo " After completing these steps, you can test the login!"
echo ""

