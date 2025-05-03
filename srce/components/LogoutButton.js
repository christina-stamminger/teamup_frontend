import React, { useEffect } from "react";
import { TouchableOpacity, Alert, BackHandler } from "react-native";
import { LogOut } from "lucide-react-native";
import * as SecureStore from "expo-secure-store";

export default function LogoutButton({ navigation }) {
  const handleLogout = async () => {
    console.log("🔑 Attempting to delete authToken...");
    try {
      await SecureStore.deleteItemAsync("authToken");
      console.log("✅ authToken deleted successfully.");

      if (!navigation || typeof navigation.replace !== "function") {
        console.error("❌ Navigation object is invalid:", navigation);
        Alert.alert("Error", "Navigation is not available.");
        return;
      }

      console.log("🔁 Navigating to Login screen...");
      navigation.replace("Login");
    } catch (error) {
      console.error("❌ Error clearing auth token:", error);
      Alert.alert("Logout Failed", "Something went wrong. Please try again.");
    }
  };

  const handlePress = () => {
    console.log("🧭 Logout button pressed. Showing alert...");
    Alert.alert("Logging out", "Are you sure?", [
      { text: "Cancel", style: "cancel", onPress: () => console.log("🚫 Logout canceled") },
      { text: "Logout", onPress: () => {
          console.log("✅ Logout confirmed");
          handleLogout();
        }
      },
    ]);
  };

  useEffect(() => {
    const backAction = () => {
      Alert.alert("Logging out", "Are you sure you want to log out?", [
        { text: "Cancel", style: "cancel" },
        { text: "Logout", onPress: handleLogout },
      ]);
      return true; // Prevent default back action (exit app)
    };

    // Use BackHandler.addEventListener and handle cleanup properly
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    // Cleanup correctly when component unmounts
    return () => {
      console.log("🧹 Cleaning up back handler...");
      backHandler.remove(); // Correct cleanup method for React Native 0.70+
    };
  }, []); // Empty dependency array ensures this effect only runs once

  return (
    <TouchableOpacity onPress={handlePress} style={{ marginRight: 16 }}>
      <LogOut size={24} color="#5fc9c9" />
    </TouchableOpacity>
  );
}
