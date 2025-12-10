import { Platform } from 'react-native';

/**
 * Keycloak OAuth Configuration
 * 
 * TODO: replace hardcoded computer's IP address instead of localhost for mobile devices, 
 */

const KEYCLOAK_HOST_IP = process.env.EXPO_PUBLIC_KEYCLOAK_HOST_IP || '192.168.1.54';
const KEYCLOAK_PORT = '8181';

// Use IP address for mobile, localhost for web
const getKeycloakBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_KEYCLOAK_URL) {
    return process.env.EXPO_PUBLIC_KEYCLOAK_URL;
  }
  
  // Use IP address for native platforms (iOS/Android), localhost for web
  if (Platform.OS === 'web') {
    return `http://localhost:${KEYCLOAK_PORT}`;
  } else {
    return `http://${KEYCLOAK_HOST_IP}:${KEYCLOAK_PORT}`;
  }
};

export const KeycloakConfig = {
  KEYCLOAK_URL: getKeycloakBaseUrl(),
  
  REALM: process.env.EXPO_PUBLIC_KEYCLOAK_REALM || 'master',
  
  CLIENT_ID: process.env.EXPO_PUBLIC_KEYCLOAK_CLIENT_ID || 'edu-portal-client',
  
  REDIRECT_URI: process.env.EXPO_PUBLIC_REDIRECT_URI || 'exp://127.0.0.1:8081',
};

export const getKeycloakEndpoints = () => {
  const baseUrl = `${KeycloakConfig.KEYCLOAK_URL}/realms/${KeycloakConfig.REALM}`;
  
  return {
    authorizationEndpoint: `${baseUrl}/protocol/openid-connect/auth`,
    tokenEndpoint: `${baseUrl}/protocol/openid-connect/token`,
    revocationEndpoint: `${baseUrl}/protocol/openid-connect/revoke`,
    userInfoEndpoint: `${baseUrl}/protocol/openid-connect/userinfo`,
  };
};

