import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { getPushToken, registerForPushNotificationsAsync } from '@/services/notifications';

interface NotificationState {
  // State
  pushToken: string | null;
  isRegistered: boolean;
  isLoading: boolean;
  permissionStatus: 'undetermined' | 'granted' | 'denied';

  // Actions
  setLoading: (loading: boolean) => void;
  registerForNotifications: () => Promise<boolean>;
  getStoredToken: () => Promise<string | null>;
  clearToken: () => Promise<void>;
}

const PUSH_TOKEN_KEY = 'push_notification_token';

export const useNotificationStore = create<NotificationState>()((set, get) => ({
  // Initial state
  pushToken: null,
  isRegistered: false,
  isLoading: false,
  permissionStatus: 'undetermined',

  // Actions
  setLoading: (loading: boolean) => set({ isLoading: loading }),

  registerForNotifications: async () => {
    try {
      set({ isLoading: true });
      const token = await registerForPushNotificationsAsync();
      
      if (token) {
        // Store token securely
        await SecureStore.setItemAsync(PUSH_TOKEN_KEY, token);
        set({
          pushToken: token,
          isRegistered: true,
          permissionStatus: 'granted',
        });
        return true;
      } else {
        set({
          permissionStatus: 'denied',
          isRegistered: false,
        });
        return false;
      }
    } catch (error) {
      console.error('Error registering for notifications:', error);
      set({
        permissionStatus: 'denied',
        isRegistered: false,
      });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  getStoredToken: async () => {
    try {
      const stored = await SecureStore.getItemAsync(PUSH_TOKEN_KEY);
      if (stored) {
        set({ pushToken: stored, isRegistered: true });
        return stored;
      }
      
      // Try to get current token
      const currentToken = await getPushToken();
      if (currentToken) {
        await SecureStore.setItemAsync(PUSH_TOKEN_KEY, currentToken);
        set({ pushToken: currentToken, isRegistered: true });
        return currentToken;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting stored token:', error);
      return null;
    }
  },

  clearToken: async () => {
    try {
      await SecureStore.deleteItemAsync(PUSH_TOKEN_KEY);
      set({
        pushToken: null,
        isRegistered: false,
        permissionStatus: 'undetermined',
      });
    } catch (error) {
      console.error('Error clearing token:', error);
    }
  },
}));

