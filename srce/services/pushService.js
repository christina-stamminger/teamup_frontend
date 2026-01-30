import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { API_URL } from '../config/env';

let alreadyRegistered = false;

export async function registerPushTokenSafely(accessToken) {
  if (!accessToken || alreadyRegistered) return;

  // Permission
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') {
    const req = await Notifications.requestPermissionsAsync();
    if (req.status !== 'granted') return;
  }

  // Project ID
  const projectId =
    Constants.easConfig?.projectId ||
    Constants.expoConfig?.extra?.eas?.projectId;

  if (!projectId) return;

  const result = await Notifications.getExpoPushTokenAsync({ projectId });
  const expoPushToken = result.data;

  try {
    await fetch(`${API_URL}/devices/push-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ expoPushToken }),
    });
  } catch { }

  alreadyRegistered = true;
}
