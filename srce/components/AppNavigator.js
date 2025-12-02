import React from "react";
import { useUser } from "./context/UserContext";

import AuthNavigator from "./AuthNavigator";
import AppStackNavigator from "./AppStackNavigator";

export default function AppNavigator() {
  const { accessToken, loading } = useUser();

  if (loading) {
    // Optional: Splash Screen, Loader, Branding etc.
    return null;
  }

  // 🟢 Benutzer eingeloggt
  if (accessToken) {
    return <AppStackNavigator />;
  }

  // 🔴 Benutzer nicht eingeloggt → Login/Register Screens
  return <AuthNavigator />;
}
