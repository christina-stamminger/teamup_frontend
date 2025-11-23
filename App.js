import React from "react";
import AppNavigator from "./srce/components/AppNavigator";
import { UserProvider } from "./srce/components/context/UserContext";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';
import { toastConfig } from './srce/config/toastConfig';
import { BackHandler } from 'react-native';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { linking } from './srce/components/AppNavigator';
import { NetworkProvider } from "./srce/components/context/NetworkContext";
import OfflineBanner from "./srce/components/OfflineBanner";

export default function App() {
  const navigationRef = useNavigationContainerRef();

  // Remove deprecated listener warning
  BackHandler.removeEventListener = (...args) => {
    console.warn('DEPRECATED BackHandler.removeEventListener used!', args);
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* ✔ FIX: Users provider must wrap everything */}
      <UserProvider>
        {/* ✔ NetworkProvider AFTER UserProvider! */}
        <NetworkProvider>
          <NavigationContainer ref={navigationRef} linking={linking}>
            <OfflineBanner />
            <AppNavigator />
          </NavigationContainer>
          <Toast config={toastConfig} />
        </NetworkProvider>
      </UserProvider>
    </GestureHandlerRootView>
  );
}
