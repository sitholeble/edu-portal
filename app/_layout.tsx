import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import 'react-native-reanimated';

import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { OnboardingProvider, useOnboarding } from '@/contexts/OnboardingContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { setupNotificationListeners } from '@/services/notifications';
import { useNotificationStore } from '@/stores/notificationStore';

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { isOnboardingComplete, isLoading: onboardingLoading } = useOnboarding();
  const segments = useSegments();
  const router = useRouter();
  const registerForNotifications = useNotificationStore((state) => state.registerForNotifications);
  const getStoredToken = useNotificationStore((state) => state.getStoredToken);

  useEffect(() => {
    const subscription = setupNotificationListeners(
      (notification) => {
        console.log('Notification received:', notification);
      },
      (response) => {
        console.log('Notification tapped:', response);
        const data = response.notification.request.content.data;
        if (data?.screen) {
          router.push(data.screen as any);
        }
      }
    );

    return () => {
      subscription.remove();
    };
  }, [router]);

  // Register for push notifications when user is authenticated
  useEffect(() => {
    if (isAuthenticated && isOnboardingComplete) {
      // Try to get stored token first
      getStoredToken().then((token) => {
        if (!token) {
          // If no token, register for notifications
          registerForNotifications();
        }
      });
    }
  }, [isAuthenticated, isOnboardingComplete, getStoredToken, registerForNotifications]);

  useEffect(() => {
    if (authLoading || onboardingLoading) return;

    const inAuthGroup = segments[0] === 'login';
    const inOnboardingGroup = segments[0] === 'onboarding';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/login');
    } else if (isAuthenticated && inAuthGroup) {
      if (!isOnboardingComplete && !inOnboardingGroup) {
        router.replace('/onboarding');
      } else if (isOnboardingComplete && !inOnboardingGroup) {
        router.replace('/(tabs)');
      }
    } else if (isAuthenticated && isOnboardingComplete && inOnboardingGroup) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, authLoading, isOnboardingComplete, onboardingLoading, segments]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <OnboardingProvider>
        <RootLayoutNav />
      </OnboardingProvider>
    </AuthProvider>
  );
}
