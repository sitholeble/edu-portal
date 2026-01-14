import { useEffect } from 'react';
import { useNotificationStore } from '@/stores/notificationStore';
import { setupNotificationListeners } from '@/services/notifications';
import { useRouter } from 'expo-router';

/**
 * Hook to manage push notifications
 */
export function useNotifications() {
  const router = useRouter();
  const registerForNotifications = useNotificationStore((state) => state.registerForNotifications);
  const getStoredToken = useNotificationStore((state) => state.getStoredToken);
  const pushToken = useNotificationStore((state) => state.pushToken);
  const isRegistered = useNotificationStore((state) => state.isRegistered);
  const isLoading = useNotificationStore((state) => state.isLoading);
  const permissionStatus = useNotificationStore((state) => state.permissionStatus);

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
        } else if (data?.eventId) {
          router.push(`/(tabs)/calendar/${data.eventId}` as any);
        } else if (data?.memberId) {
          router.push(`/(tabs)/family/${data.memberId}` as any);
        }
      }
    );

    return () => {
      subscription.remove();
    };
  }, [router]);

  return {
    pushToken,
    isRegistered,
    isLoading,
    permissionStatus,
    registerForNotifications,
    getStoredToken,
  };
}

