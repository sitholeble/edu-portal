import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Button, StyleSheet, Switch, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useNotifications } from '@/hooks/use-notifications';
import { scheduleLocalNotification } from '@/services/notifications';
import { useNotificationStore } from '@/stores';

export default function SettingsScreen() {
  const router = useRouter();
  const {
    pushToken,
    isRegistered,
    isLoading,
    permissionStatus,
    registerForNotifications,
  } = useNotifications();
  const clearToken = useNotificationStore((state) => state.clearToken);
  const [notificationsEnabled, setNotificationsEnabled] = useState(isRegistered);

  const handleToggleNotifications = async () => {
    if (notificationsEnabled) {
      // Disable notifications
      Alert.alert(
        'Disable Notifications',
        'Are you sure you want to disable push notifications?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Disable',
            style: 'destructive',
            onPress: async () => {
              await clearToken();
              setNotificationsEnabled(false);
            },
          },
        ]
      );
    } else {
      // Enable notifications
      const success = await registerForNotifications();
      if (success) {
        setNotificationsEnabled(true);
        Alert.alert('Success', 'Push notifications enabled!');
      } else {
        Alert.alert(
          'Permission Denied',
          'Please enable notifications in your device settings to receive push notifications.'
        );
      }
    }
  };

  const handleTestNotification = async () => {
    try {
      // Schedule notification to appear in 2 seconds
      await scheduleLocalNotification(
        'Test Notification',
        'This is a test notification from Edu Portal!',
        { test: true, screen: '/(tabs)/settings' },
        { seconds: 2 } // Show in 2 seconds
      );
      Alert.alert('Success', 'Test notification scheduled! It will appear in 2 seconds.');
    } catch (error) {
      console.error('Error testing notification:', error);
      Alert.alert('Error', 'Failed to schedule test notification. Check console for details.');
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.section}>
        <ThemedText type="title" style={styles.title}>
          Settings
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Notifications
        </ThemedText>

        <View style={styles.settingRow}>
          <View style={styles.settingContent}>
            <ThemedText style={styles.settingLabel}>Push Notifications</ThemedText>
            <ThemedText style={styles.settingDescription}>
              Receive notifications for calendar events and reminders
            </ThemedText>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={handleToggleNotifications}
            disabled={isLoading}
          />
        </View>

        {pushToken && (
          <View style={styles.tokenContainer}>
            <ThemedText style={styles.tokenLabel}>Push Token:</ThemedText>
            <ThemedText style={styles.tokenValue} numberOfLines={2}>
              {pushToken}
            </ThemedText>
          </View>
        )}

        <View style={styles.statusContainer}>
          <ThemedText style={styles.statusLabel}>Status:</ThemedText>
          <ThemedText
            style={[
              styles.statusValue,
              permissionStatus === 'granted' && styles.statusGranted,
              permissionStatus === 'denied' && styles.statusDenied,
            ]}>
            {permissionStatus === 'granted'
              ? 'Enabled'
              : permissionStatus === 'denied'
                ? 'Denied'
                : 'Not Set'}
          </ThemedText>
        </View>

        <View style={styles.testContainer}>
          <Button
            title="Test Local Notification"
            onPress={handleTestNotification}
            color="#007AFF"
          />
          <ThemedText style={styles.testDescription}>
            Test local notifications (works in Expo Go). A notification will appear in 2 seconds.
          </ThemedText>
        </View>
      </ThemedView>

      <ThemedView style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          About
        </ThemedText>
        <ThemedText style={styles.version}>Version 1.0.0</ThemedText>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  settingContent: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    opacity: 0.7,
  },
  tokenContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
  },
  tokenLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    opacity: 0.7,
  },
  tokenValue: {
    fontSize: 11,
    fontFamily: 'monospace',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  statusLabel: {
    fontSize: 14,
    marginRight: 8,
    opacity: 0.7,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusGranted: {
    color: '#34C759',
  },
  statusDenied: {
    color: '#FF3B30',
  },
  version: {
    fontSize: 14,
    opacity: 0.7,
  },
  testContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderRadius: 8,
  },
  testDescription: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 8,
    textAlign: 'center',
  },
});

