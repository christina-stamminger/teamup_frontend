import React, { useEffect } from "react";
import AppNavigator from "./srce/components/AppNavigator"; // Fix path if needed
import { UserProvider } from "./srce/components/context/UserContext";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';
import { toastConfig } from './srce/config/toastConfig';
import { BackHandler, Linking } from 'react-native';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { linking } from './srce/components/AppNavigator'; // <-- export linking from AppNavigator.js


export default function App() {
  const navigationRef = useNavigationContainerRef();

  // Remove deprecated listener warning (temporary)
  BackHandler.removeEventListener = (...args) => {
    console.warn('DEPRECATED BackHandler.removeEventListener used!', args);
  };

  // Handle deep linking
  useEffect(() => {
    const handleDeepLink = (event) => {
      const url = event?.url;
      if (!url) return;

      const parsed = Linking.parse(url);
      const token = parsed?.queryParams?.token;

      if (url.includes("reset-password") && token) {
        navigationRef.current?.navigate("ResetPassword", { token });
      }
    };

    // Listen for future deep links
    const subscription = Linking.addEventListener("url", handleDeepLink);

    // Handle initial launch via deep link
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink({ url });
    });

    return () => subscription.remove();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <UserProvider>
        <NavigationContainer ref={navigationRef} linking={linking}>
          <AppNavigator />
        </NavigationContainer>
        <Toast config={toastConfig} />
      </UserProvider>
    </GestureHandlerRootView>
  );
}
