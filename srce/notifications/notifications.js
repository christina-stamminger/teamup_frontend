import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// GLOBAL: keine Banner, kein Sound, nur Badge
export function setupNotifications() {
  // Notification Handler ist in Expo Go sicher (no-op)
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: false,
      shouldPlaySound: false,
      shouldSetBadge: true,
    }),
  });

  // Android: Silent Channel
  if (Platform.OS === 'android') {
    try {
      Notifications.setNotificationChannelAsync('badge', {
        name: 'Badge Updates',
        importance: Notifications.AndroidImportance.MIN,
        sound: undefined,
        vibrationPattern: [],
        lockscreenVisibility:
          Notifications.AndroidNotificationVisibility.SECRET,
        showBadge: true,
      });
    } catch {
      // Expo Go / unsupported runtime → ignore
    }
  }
}
