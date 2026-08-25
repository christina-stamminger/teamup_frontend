import * as Notifications from "expo-notifications";
import { Platform } from "react-native";


export function setupNotifications() {

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });


  if (Platform.OS === "android") {

    Notifications.setNotificationChannelAsync(
      "chat",
      {
        name: "Chat-Nachrichten",
        importance:
          Notifications.AndroidImportance.HIGH,

        sound: "default",

        vibrationPattern: [
          0,
          250,
          250,
          250,
        ],

        showBadge: true,
      }
    );
  }
}