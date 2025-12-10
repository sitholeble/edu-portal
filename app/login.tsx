import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Alert, Button, StyleSheet, View } from 'react-native';

export default function LoginScreen() {
  const { login, isLoading, isAuthenticated, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated]);

  const handleLogin = async () => {
    try {
      console.log('🔐 Login button pressed');
      await login();
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An error occurred during login. Please try again.';
      if (errorMessage !== 'Login was cancelled') {
        Alert.alert(
          'Login Failed',
          errorMessage,
          [{ text: 'OK' }]
        );
      }
    }
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" />
        <ThemedText style={styles.loadingText}>Loading...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <ThemedText type="title" style={styles.title}>
          Welcome to Edu Portal
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Sign in with your account to continue
        </ThemedText>

        <View style={styles.buttonContainer}>
          <Button
            title="Sign in with Keycloak"
            onPress={handleLogin}
            disabled={isLoading}
          />
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 40,
    textAlign: 'center',
    opacity: 0.7,
  },
  buttonContainer: {
    width: '100%',
    marginTop: 20,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
  },
});

