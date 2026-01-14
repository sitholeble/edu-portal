import { useEffect, useState } from 'react';
import { createNetworkListener, isOnline, type NetworkError } from '@/services/network';

export interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string | null;
}

/**
 * Hook to monitor network status
 */
export function useNetwork() {
  const [networkState, setNetworkState] = useState<NetworkState>({
    isConnected: true,
    isInternetReachable: null,
    type: null,
  });

  useEffect(() => {
    isOnline().then((connected) => {
      setNetworkState((prev) => ({ ...prev, isConnected: connected }));
    });

    const unsubscribe = createNetworkListener((isConnected) => {
      setNetworkState((prev) => ({ ...prev, isConnected }));
    });

    return unsubscribe;
  }, []);

  return networkState;
}

/**
 * Hook to handle network errors with retry
 */
export function useNetworkError() {
  const handleError = (error: any): NetworkError => {
    const { parseNetworkError } = require('@/services/network');
    return parseNetworkError(error);
  };

  return { handleError };
}

