import React, { useEffect } from "react";
import { TouchableOpacity, Alert, BackHandler } from "react-native";
import { LogOut } from "lucide-react-native";
import * as SecureStore from "expo-secure-store";

export default function LogoutButton({ navigation }) {
  const handleLogout = async () => {
    console.log("🔑 Versuche, authToken zu löschen...");
    try {
      await SecureStore.deleteItemAsync("authToken");
      console.log("✅ authToken erfolgreich gelöscht.");

      if (!navigation || typeof navigation.replace !== "function") {
        console.error("❌ Navigation ist ungültig:", navigation);
        Alert.alert("Fehler", "Navigation ist nicht verfügbar.");
        return;
      }

      console.log("🔁 Navigiere zum Login-Screen...");
      navigation.replace("Login");
    } catch (error) {
      console.error("❌ Fehler beim Löschen des Tokens:", error);
      Alert.alert(
        "Abmeldung fehlgeschlagen",
        "Beim Abmelden ist ein Fehler aufgetreten. Bitte versuche es erneut."
      );
    }
  };

  const handlePress = () => {
    console.log("🧭 Logout-Button gedrückt. Zeige Bestätigungsdialog...");
    Alert.alert("Abmelden", "Möchtest du dich wirklich abmelden?", [
      { text: "Abbrechen", style: "cancel", onPress: () => console.log("🚫 Logout abgebrochen") },
      {
        text: "Abmelden",
        onPress: () => {
          console.log("✅ Logout bestätigt");
          handleLogout();
        },
      },
    ]);
  };

  useEffect(() => {
    const backAction = () => {
      Alert.alert("Abmelden", "Möchtest du dich wirklich abmelden?", [
        { text: "Abbrechen", style: "cancel" },
        { text: "Abmelden", onPress: handleLogout },
      ]);
      return true; // verhindert, dass die App beim Zurück-Button geschlossen wird
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => {
      console.log("🧹 BackHandler aufräumen...");
      backHandler.remove();
    };
  }, []);

  return (
    <TouchableOpacity onPress={handlePress} style={{ marginRight: 16 }}>
      <LogOut size={24} color="#5fc9c9" />
    </TouchableOpacity>
  );
}
