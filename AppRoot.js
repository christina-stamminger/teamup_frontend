import React from "react";
import { View, ActivityIndicator } from "react-native";
import { useUser } from "./srce/components/context/UserContext";
import AuthNavigator from "./srce/components/AuthNavigator";
import AppStackNavigator from "./srce/components/AppStackNavigator";

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
