import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { API_URL, APP_ENV } from "../../config/env";


export async function registerPushToken(accessToken) {
  if (!accessToken) return;

  // 1️⃣ Permission
  const { status } = await Notifications.getPermissionsAsync();
  let finalStatus = status;

  if (finalStatus !== 'granted') {
    const request = await Notifications.requestPermissionsAsync();
    finalStatus = request.status;
  }

  if (finalStatus !== 'granted') {
    console.warn('🔕 Push permission not granted');
    return;
  }

  // 2️⃣ Project ID
  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  if (!projectId) {
    console.log('ℹ️ No projectId → likely Expo Go');
    return;
  }

  let expoPushToken;

  try {
    const result = await Notifications.getExpoPushTokenAsync({ projectId });
    expoPushToken = result.data;
  } catch {
    console.log('ℹ️ Push not supported in this runtime');
    return;
  }

  // 3️⃣ Backend (silent, fire-and-forget)
  try {
    const response = await fetch(`${API_URL}/devices/push-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        expoPushToken,
        platform: Platform.OS.toUpperCase(),
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.log('ℹ️ Push token not registered:', text);
    }
  } catch (err) {
    console.log('ℹ️ Push token request failed');
  }
}
