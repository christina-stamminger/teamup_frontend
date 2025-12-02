import React from "react";
import AppNavigator from "./srce/components/AppNavigator";
import { UserProvider } from "./srce/components/context/UserContext";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';
import { toastConfig } from './srce/config/toastConfig';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { NetworkProvider } from "./srce/components/context/NetworkContext";
import OfflineBanner from "./srce/components/OfflineBanner";
import { BackHandler } from 'react-native';

export default function App() {
  const navigationRef = useNavigationContainerRef();

  // **Fix für RN 0.72+: removeEventListener existiert nicht mehr**
  if (!BackHandler.removeEventListener) {
    BackHandler.removeEventListener = () => {};
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <UserProvider>
        <NetworkProvider>
          <NavigationContainer ref={navigationRef}>
            <OfflineBanner />
            <AppNavigator />
          </NavigationContainer>

          <Toast config={toastConfig} />
        </NetworkProvider>
      </UserProvider>
    </GestureHandlerRootView>
  );
}
