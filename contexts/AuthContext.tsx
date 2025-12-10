import { KeycloakConfig, getKeycloakEndpoints } from '@/constants/keycloak';
import * as AuthSession from 'expo-auth-session';
import * as SecureStore from 'expo-secure-store';
import React, { ReactNode, createContext, useContext, useEffect, useState } from 'react';

interface User {
  id: string;
  email?: string;
  name?: string;
  preferred_username?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_STORAGE_KEY = 'auth_token';
const REFRESH_TOKEN_STORAGE_KEY = 'refresh_token';
const USER_STORAGE_KEY = 'user_data';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Load stored authentication state on mount
  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_STORAGE_KEY);
      const userData = await SecureStore.getItemAsync(USER_STORAGE_KEY);
      
      if (token && userData) {
        setUser(JSON.parse(userData));
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async () => {
    try {
      setIsLoading(true);
      
      const endpoints = getKeycloakEndpoints();
      const redirectUri = AuthSession.makeRedirectUri();

      const request = new AuthSession.AuthRequest({
        clientId: KeycloakConfig.CLIENT_ID,
        scopes: ['openid', 'profile', 'email'],
        responseType: AuthSession.ResponseType.Code,
        redirectUri,
        usePKCE: true,
        codeChallengeMethod: AuthSession.CodeChallengeMethod.S256,
        extraParams: {},
      });

      const discovery = {
        authorizationEndpoint: endpoints.authorizationEndpoint,
        tokenEndpoint: endpoints.tokenEndpoint,
        revocationEndpoint: endpoints.revocationEndpoint,
      };

      // Ensure PKCE code verifier is generated before authorization
      await request.makeAuthUrlAsync(discovery);
      
      const result = await request.promptAsync(discovery);

      if (result.type === 'success') {
        const { code } = result.params;
        
        // Exchange authorization code for tokens
        const tokenResponse = await AuthSession.exchangeCodeAsync(
          {
            clientId: KeycloakConfig.CLIENT_ID,
            code,
            redirectUri,
            extraParams: {
              code_verifier: request.codeVerifier || '',
            },
          },
          discovery
        );

        // Store tokens securely
        await SecureStore.setItemAsync(TOKEN_STORAGE_KEY, tokenResponse.accessToken);
        if (tokenResponse.refreshToken) {
          await SecureStore.setItemAsync(REFRESH_TOKEN_STORAGE_KEY, tokenResponse.refreshToken);
        }

        // Fetch user info
        const userInfoResponse = await fetch(endpoints.userInfoEndpoint, {
          headers: {
            Authorization: `Bearer ${tokenResponse.accessToken}`,
          },
        });

        if (userInfoResponse.ok) {
          const userInfo = await userInfoResponse.json();
          const userData: User = {
            id: userInfo.sub,
            email: userInfo.email,
            name: userInfo.name,
            preferred_username: userInfo.preferred_username,
          };
          
          await SecureStore.setItemAsync(USER_STORAGE_KEY, JSON.stringify(userData));
          setUser(userData);
          setIsAuthenticated(true);
        } else {
          throw new Error('Failed to fetch user information');
        }
      } else if (result.type === 'error') {
        throw new Error(result.error?.message || 'Authentication failed');
      } else if (result.type === 'dismiss') {
        throw new Error('Login was cancelled');
      } else {
        throw new Error('Unexpected authentication result');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      
      const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_STORAGE_KEY);
      const endpoints = getKeycloakEndpoints();

      if (refreshToken) {
        try {
          await fetch(endpoints.revocationEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              client_id: KeycloakConfig.CLIENT_ID,
              refresh_token: refreshToken,
            }).toString(),
          });
        } catch (error) {
          console.error('Error revoking token:', error);
        }
      }

      // Clear stored data
      await SecureStore.deleteItemAsync(TOKEN_STORAGE_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_STORAGE_KEY);
      await SecureStore.deleteItemAsync(USER_STORAGE_KEY);

      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshToken = async () => {
    try {
      const refreshTokenValue = await SecureStore.getItemAsync(REFRESH_TOKEN_STORAGE_KEY);
      if (!refreshTokenValue) {
        throw new Error('No refresh token available');
      }

      const endpoints = getKeycloakEndpoints();
      const response = await fetch(endpoints.tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: KeycloakConfig.CLIENT_ID,
          refresh_token: refreshTokenValue,
        }).toString(),
      });

      if (response.ok) {
        const tokenData = await response.json();
        await SecureStore.setItemAsync(TOKEN_STORAGE_KEY, tokenData.access_token);
        if (tokenData.refresh_token) {
          await SecureStore.setItemAsync(REFRESH_TOKEN_STORAGE_KEY, tokenData.refresh_token);
        }
      } else {
        throw new Error('Failed to refresh token');
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      // If refresh fails, logout the user
      await logout();
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        login,
        logout,
        refreshToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
