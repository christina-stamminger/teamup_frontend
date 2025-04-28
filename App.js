import React from "react";
import AppNavigator from "./srce/components/AppNavigator"; // Fix path if needed
import { UserProvider } from "./srce/components/context/UserContext"; // Fix path if needed
import { GestureHandlerRootView } from 'react-native-gesture-handler';


export default function App() {
  return (
    // Wrap with both UserProvider and TodosProvider to share user and todo state across the app
    <GestureHandlerRootView style={{ flex: 1 }}>
    <UserProvider>
        <AppNavigator />
    </UserProvider>
    </GestureHandlerRootView>
  );
}