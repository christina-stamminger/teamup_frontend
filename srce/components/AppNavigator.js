import React from "react";
import { useUser } from "./context/UserContext"; 

import AuthNavigator from "./AuthNavigator";
import AppStackNavigator from "./AppStackNavigator";

export default function AppNavigator() {
  const { accessToken, loading } = useUser();

  if (loading) {
    // Optional: Splash Screen
    return null;
  }

  // 🟢 Token vorhanden → App
  if (accessToken) {
    return <AppStackNavigator />;
  }

  // 🔴 Kein Token → Auth Screens
  return <AuthNavigator />;
}
