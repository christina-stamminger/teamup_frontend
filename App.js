import React from "react";
import AppNavigator from "./srce/components/AppNavigator"; // Fix path if needed
import { UserProvider } from "./srce/components/context/UserContext"; // Fix path if needed
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message'; // instead of alerts, short messages
import { toastConfig } from './srce/config/toastConfig'; // import your custom config
import { BackHandler } from 'react-native'; // DELETE asap error does not occur anymore

// DELETE asap error does not occur anymore
export default function App() {

  BackHandler.removeEventListener = (...args) => {
    console.warn('🚨 DEPRECATED BackHandler.removeEventListener used!', args);
  };

  return (
    // Wrap with both UserProvider and TodosProvider to share user and todo state across the app
    <GestureHandlerRootView style={{ flex: 1 }}>
    <UserProvider>
        <AppNavigator />
       <Toast config={toastConfig} />
    </UserProvider>
    </GestureHandlerRootView>
  );
}