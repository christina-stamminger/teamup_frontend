import React from "react";
import { View, ActivityIndicator } from "react-native";
import { useUser } from "./srce/components/context/UserContext";
import AppNavigator from "./srce/components/AppNavigator";
import AuthNavigator from "./srce/components/AuthNavigator";

export default function AppRoot() {
  const { loading, authReady } = useUser();

  // ⏳ App initialisiert sich noch
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // 🔐 Nicht eingeloggt → Auth Flow
  if (!authReady) {
    return <AuthNavigator />;
  }

  // ✅ Eingeloggt → App Flow
  return <AppNavigator />;
}
