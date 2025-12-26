import React from "react";
import { View, ActivityIndicator } from "react-native";
import { useUser } from "./context/UserContext";

import AuthNavigator from "./AuthNavigator";
import AppStackNavigator from "./AppStackNavigator";

export default function AppNavigator() {
  const { accessToken, loading } = useUser();

  // ✅ NIE null rendern
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // 🟢 Eingeloggt
  if (accessToken) {
    return <AppStackNavigator />;
  }

  // 🔴 Nicht eingeloggt
  return <AuthNavigator />;
}
