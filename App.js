import React from "react";
import AppNavigator from "./srce/components/AppNavigator";
import { UserProvider } from "./srce/components/context/UserContext";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';
import { toastConfig } from './srce/config/toastConfig';
import { BackHandler } from 'react-native';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { linking } from './srce/components/AppNavigator';
import { NetworkProvider } from "./srce/components/context/NetworkContext"; // check for internet connectivity
import OfflineBanner from "./srce/components/OfflineBanner";

export default function App() {
  const navigationRef = useNavigationContainerRef();

  // Remove deprecated listener warning
  BackHandler.removeEventListener = (...args) => {
    console.warn('DEPRECATED BackHandler.removeEventListener used!', args);
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NetworkProvider>
        <UserProvider>
          <NavigationContainer ref={navigationRef} linking={linking}>
            <OfflineBanner />
            <AppNavigator />
          </NavigationContainer>
          <Toast config={toastConfig} />
        </UserProvider>
      </NetworkProvider>
    </GestureHandlerRootView>
  );
}


