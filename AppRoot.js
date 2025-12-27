import React from "react";
import { View, ActivityIndicator } from "react-native";
import { useUser } from "./context/UserContext";
import AuthNavigator from "./AuthNavigator";
import AppStackNavigator from "./AppStackNavigator";

export default function AppRoot() {
  const { loading, authReady, accessToken } = useUser();

  if (loading || !authReady) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return accessToken ? <AppStackNavigator /> : <AuthNavigator />;
}
