import NetInfo from '@react-native-community/netinfo';
import { Alert } from 'react-native';

export interface NetworkError {
  message: string;
  code?: string;
  status?: number;
  isNetworkError: boolean;
  isTimeout: boolean;
  isOffline: boolean;
}

export async function isOnline(): Promise<boolean> {
  const state = await NetInfo.fetch();
  return state.isConnected ?? false;
}

export async function getNetworkState() {
  return await NetInfo.fetch();
}

export function parseNetworkError(error: any): NetworkError {
  const errorMessage = error?.message || 'Unknown error';
  
  const isNetworkError = 
    errorMessage.includes('Network request failed') ||
    errorMessage.includes('Failed to fetch') ||
    errorMessage.includes('NetworkError') ||
    error?.name === 'TypeError' ||
    error?.code === 'NETWORK_ERROR';

  const isTimeout = 
    errorMessage.includes('timeout') ||
    errorMessage.includes('TIMEOUT') ||
    error?.code === 'TIMEOUT';

  return {
    message: errorMessage,
    code: error?.code,
    status: error?.status,
    isNetworkError,
    isTimeout,
    isOffline: false, 
  };
}

/**
 * Enhanced fetch with retry logic and error handling
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  maxRetries: number = 3,
  retryDelay: number = 1000
): Promise<Response> {
  const isConnected = await isOnline();
  if (!isConnected) {
    throw new Error('No internet connection. Please check your network settings.');
  }

  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); 
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.status >= 500 && attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay * (attempt + 1)));
        continue;
      }

      return response;
    } catch (error: any) {
      lastError = error;

      if (error.name === 'AbortError' || (error.status && error.status < 500)) {
        throw parseNetworkError(error);
      }

      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay * (attempt + 1)));
        continue;
      }
    }
  }

  throw parseNetworkError(lastError);
}

export function getUserFriendlyErrorMessage(error: NetworkError): string {
  if (error.isOffline) {
    return 'No internet connection. Please check your network and try again.';
  }

  if (error.isTimeout) {
    return 'Request timed out. Please check your connection and try again.';
  }

  if (error.isNetworkError) {
    return 'Network error. Please check your internet connection and try again.';
  }

  if (error.status === 401) {
    return 'Authentication failed. Please log in again.';
  }

  if (error.status === 403) {
    return 'You do not have permission to perform this action.';
  }

  if (error.status === 404) {
    return 'The requested resource was not found.';
  }

  if (error.status === 500) {
    return 'Server error. Please try again later.';
  }

  if (error.status && error.status >= 500) {
    return 'Server error. Please try again later.';
  }

  return error.message || 'An unexpected error occurred. Please try again.';
}

export function showNetworkError(error: NetworkError, title: string = 'Error') {
  const message = getUserFriendlyErrorMessage(error);
  Alert.alert(title, message, [{ text: 'OK' }]);
}

export function createNetworkListener(
  onStatusChange: (isConnected: boolean) => void
): () => void {
  const unsubscribe = NetInfo.addEventListener((state) => {
    onStatusChange(state.isConnected ?? false);
  });

  return () => unsubscribe();
}

