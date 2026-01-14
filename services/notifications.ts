import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => {
    const isExpoGo = Constants.executionEnvironment === 'storeClient';
    
    if (isExpoGo) {
      console.warn('Push notifications require a development build. Expo Go does not support push notifications in SDK 53+.');
      return {
        shouldShowAlert: false,
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowBanner: false,
        shouldShowList: false,
      };
    }
    
    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    };
  },
});

export interface PushNotificationToken {
  token: string;
  deviceId: string;
}

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  const isExpoGo = Constants.executionEnvironment === 'storeClient';
  
  if (isExpoGo) {
    console.warn('Push notifications require a development build. Expo Go does not support push notifications in SDK 53+.');
    console.warn('To test push notifications, create a development build: npx expo run:android or npx expo run:ios');
    return null;
  }

  let token: string | null = null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Failed to get push token for push notification!');
      return null;
    }

    try {
      const projectId =
        process.env.EXPO_PUBLIC_PROJECT_ID ||
        Constants.expoConfig?.extra?.eas?.projectId ||
        Constants.easConfig?.projectId ||
        '2ad40863-43fd-49a0-8730-b14a41e7a8e3'; 
      
      if (!projectId) {
        console.warn('No Expo project ID found. Set EXPO_PUBLIC_PROJECT_ID environment variable.');
        return null;
      }

      const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
      token = tokenData.data;
      console.log('Push token:', token);
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  } else {
    console.warn('Must use physical device for Push Notifications');
  }

  return token;
}

/**
 * Get the current push notification token
 */
export async function getPushToken(): Promise<string | null> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      return null;
    }

    const projectId =
      process.env.EXPO_PUBLIC_PROJECT_ID ||
      Constants.expoConfig?.extra?.eas?.projectId ||
      Constants.easConfig?.projectId ||
      '2ad40863-43fd-49a0-8730-b14a41e7a8e3'; 

    if (!projectId) {
      console.warn('No Expo project ID found. Set EXPO_PUBLIC_PROJECT_ID environment variable.');
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    return tokenData.data;
  } catch (error) {
    console.error('Error getting push token:', error);
    return null;
  }
}

/**
 * Schedule a local notification
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: Record<string, any>,
  trigger?: Notifications.NotificationTriggerInput | { seconds?: number }
): Promise<string> {
  let notificationTrigger: Notifications.NotificationTriggerInput | null = null;
  
  if (trigger) {
    if ('seconds' in trigger && typeof trigger.seconds === 'number') {
      notificationTrigger = {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: trigger.seconds,
        repeats: false,
      };
    } else {
      notificationTrigger = trigger as Notifications.NotificationTriggerInput;
    }
  }

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: data || {},
      sound: true,
    },
    trigger: notificationTrigger, 
  });

  return notificationId;
}

export async function cancelNotification(notificationId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function getAllScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
  return await Notifications.getAllScheduledNotificationsAsync();
}

/**
 * Send a push notification via Expo Push API
 * Note: This requires a backend server. For testing, use Expo's tool:
 * https://expo.dev/notifications
 */
export async function sendPushNotification(
  pushToken: string,
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<void> {
  const message = {
    to: pushToken,
    sound: 'default',
    title,
    body,
    data: data || {},
  };

  // This should be called from the backend server
  // For now, this is just a placeholder showing the structure
  console.log('Would send notification:', message);
  
  //TODO: Implement backend call
  // Example backend call:
  // await fetch('https://backend.com/api/notifications/send', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(message),
  // });
}

export function setupNotificationListeners(
  onNotificationReceived?: (notification: Notifications.Notification) => void,
  onNotificationTapped?: (response: Notifications.NotificationResponse) => void
): { remove: () => void } {
  const receivedListener = Notifications.addNotificationReceivedListener((notification) => {
    console.log('Notification received:', notification);
    onNotificationReceived?.(notification);
  });

  const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
    console.log('Notification tapped:', response);
    onNotificationTapped?.(response);
  });

  return {
    remove: () => {
      // In newer versions of expo-notifications, subscriptions have a remove() method
      if (receivedListener && typeof receivedListener.remove === 'function') {
        receivedListener.remove();
      }
      if (responseListener && typeof responseListener.remove === 'function') {
        responseListener.remove();
      }
    },
  };
}

