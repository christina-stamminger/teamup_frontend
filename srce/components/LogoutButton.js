import React, { useEffect } from "react";
import { TouchableOpacity, Alert, BackHandler } from "react-native";
import { LogOut } from "lucide-react-native";
import { useUser } from "../components/context/UserContext"; // <-- WICHTIG

export default function LogoutButton({ navigation }) {
  const { logoutUser } = useUser(); // <-- zentraler Logout

const handleLogout = async () => {
  console.log("🔐 Logging out…");

  try {
    await logoutUser();   // <-- alles wird gelöscht, Context reset

    console.log("✅ Logout erfolgreich");

    // ❌ NICHT navigieren!
    // navigation.replace("Login");  <-- muss weg

    // AppNavigator schaltet automatisch um
  } catch (e) {
    console.error("Logout error:", e);
  }
};


  const confirmLogout = () => {
    console.log("🧭 Logout-Button gedrückt → Dialog");
    Alert.alert(
      "Abmelden",
      "Möchtest du dich wirklich abmelden?",
      [
        { text: "Abbrechen", style: "cancel" },
        { text: "Abmelden", onPress: handleLogout },
      ]
    );
  };

  // 🔙 Hardware-Back-Button überschreiben (Android)
  useEffect(() => {
    const backAction = () => {
      Alert.alert(
        "Abmelden",
        "Möchtest du dich wirklich abmelden?",
        [
          { text: "Abbrechen", style: "cancel" },
          { text: "Abmelden", onPress: handleLogout },
        ]
      );
      return true; // verhindert App-Schließen
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => {
      console.log("🧹 Hardware back cleanup");
      backHandler.remove();
    };
  }, []);

  return (
    <TouchableOpacity onPress={confirmLogout} style={{ marginRight: 16 }}>
      <LogOut size={24} color="#5fc9c9" />
    </TouchableOpacity>
  );
}