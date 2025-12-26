import React from "react";
import { TouchableOpacity, Alert } from "react-native";
import { LogOut } from "lucide-react-native";
import { useUser } from "../components/context/UserContext";

export default function LogoutButton() {
  const { logoutUser } = useUser();

  const confirmLogout = () => {
    Alert.alert(
      "Abmelden",
      "Möchtest du dich wirklich abmelden?",
      [
        { text: "Abbrechen", style: "cancel" },
        {
          text: "Abmelden",
          style: "destructive",
          onPress: logoutUser,
        },
      ]
    );
  };

  return (
    <TouchableOpacity onPress={confirmLogout} style={{ marginRight: 16 }}>
      <LogOut size={24} color="#5fc9c9" />
    </TouchableOpacity>
  );
}
