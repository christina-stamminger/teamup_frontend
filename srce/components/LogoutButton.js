import React from "react";
import { TouchableOpacity, Alert } from "react-native";
import { LogOut } from "lucide-react-native";

export default function LogoutButton({ navigation }) {
  return (
    <TouchableOpacity
      onPress={() =>
        Alert.alert("Logging out", "Are you sure?", [
          { text: "Cancel", style: "cancel" },
          { text: "Logout", onPress: () => navigation.replace("Login") },
        ])
      }
      style={{ marginRight: 16 }}
    >
      <LogOut size={24} color="#5fc9c9" />
    </TouchableOpacity>
  );
}
