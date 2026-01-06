import React from "react";
import { TouchableOpacity } from "react-native";
import { LogOut } from "lucide-react-native";
import { useUser } from "../components/context/UserContext";

export default function LogoutButton() {
  const { logoutUser } = useUser();

  return (
    <TouchableOpacity
      onPress={logoutUser}
      style={{ marginRight: 16 }}
    >
      <LogOut size={24} color="#4FB6B8" />
    </TouchableOpacity>
  );
}
