import React from "react";
import AppNavigator from "./srce/components/AppNavigator"; // Fix path if needed
import { UserProvider } from "./srce/components/context/UserContext"; // Fix path if needed

export default function App() {
  return (
    // Wrap with both UserProvider and TodosProvider to share user and todo state across the app
    <UserProvider>
        <AppNavigator />
    </UserProvider>
  );
}