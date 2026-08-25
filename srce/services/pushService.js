import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { API_URL } from "../config/env";

let alreadyRegistered = false;

export async function registerPushTokenSafely(accessToken) {
  if (!accessToken || alreadyRegistered) {
    return;
  }

  try {
    // --------------------------------------------------
    // Notification Permission
    // --------------------------------------------------

    const { status } =
      await Notifications.getPermissionsAsync();

    let finalStatus = status;

    if (status !== "granted") {
      const request =
        await Notifications.requestPermissionsAsync();

      finalStatus = request.status;
    }

    if (finalStatus !== "granted") {
      console.log(
        "🔕 Push notification permission not granted"
      );

      return;
    }

    // --------------------------------------------------
    // Expo / EAS Project ID
    // --------------------------------------------------

    const projectId =
      Constants.easConfig?.projectId ||
      Constants.expoConfig?.extra?.eas?.projectId;

    if (!projectId) {
      console.warn(
        "⚠️ No Expo projectId available for push token registration"
      );

      return;
    }

    // --------------------------------------------------
    // Expo Push Token
    // --------------------------------------------------

    const result =
      await Notifications.getExpoPushTokenAsync({
        projectId,
      });

    const expoPushToken =
      result?.data;

    if (!expoPushToken) {
      console.warn(
        "⚠️ No Expo push token received"
      );

      return;
    }

    // --------------------------------------------------
    // Platform
    // --------------------------------------------------

    const devicePlatform =
      Platform.OS === "ios"
        ? "IOS"
        : "ANDROID";

    // --------------------------------------------------
    // Register Token in Backend
    // --------------------------------------------------

    const response =
      await fetch(
        `${API_URL}/devices/push-token`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${accessToken}`,
          },

          body: JSON.stringify({
            expoPushToken,
            platform: devicePlatform,
          }),
        }
      );

    if (!response.ok) {
      const errorText =
        await response
          .text()
          .catch(() => "");

      console.warn(
        "❌ Push token registration failed:",
        response.status,
        errorText
      );

      return;
    }

    alreadyRegistered = true;

    console.log(
      "✅ Push token registered successfully:",
      devicePlatform
    );

  } catch (error) {
    console.warn(
      "❌ Push token registration error:",
      error
    );
  }
}