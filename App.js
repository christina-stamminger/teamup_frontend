import React from "react";
import AppNavigator from "./srce/components/AppNavigator";
import { UserProvider } from "./srce/components/context/UserContext";



export default function App() {
  return (
    
    <UserProvider>  
      <AppNavigator />
    </UserProvider>
    )
}