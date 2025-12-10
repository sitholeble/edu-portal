import * as SecureStore from 'expo-secure-store';
import React, { ReactNode, createContext, useContext, useEffect, useState } from 'react';

interface OnboardingContextType {
  isOnboardingComplete: boolean;
  isLoading: boolean;
  completeOnboarding: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

const ONBOARDING_COMPLETE_KEY = 'onboarding_complete';

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadOnboardingStatus();
  }, []);

  const loadOnboardingStatus = async () => {
    try {
      const status = await SecureStore.getItemAsync(ONBOARDING_COMPLETE_KEY);
      setIsOnboardingComplete(status === 'true');
    } catch (error) {
      console.error('Error loading onboarding status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const completeOnboarding = async () => {
    try {
      await SecureStore.setItemAsync(ONBOARDING_COMPLETE_KEY, 'true');
      setIsOnboardingComplete(true);
    } catch (error) {
      console.error('Error completing onboarding:', error);
      throw error;
    }
  };

  const resetOnboarding = async () => {
    try {
      await SecureStore.deleteItemAsync(ONBOARDING_COMPLETE_KEY);
      setIsOnboardingComplete(false);
    } catch (error) {
      console.error('Error resetting onboarding:', error);
      throw error;
    }
  };

  return (
    <OnboardingContext.Provider
      value={{
        isOnboardingComplete,
        isLoading,
        completeOnboarding,
        resetOnboarding,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}

