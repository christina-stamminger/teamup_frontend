import React, { createContext, useContext, useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";

// Create the UserContext
const UserContext = createContext();

// Custom hook to access the user context easily
export const useUser = () => useContext(UserContext);

// The provider component that will wrap your app and provide the user context
export const UserProvider = ({ children }) => {
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load userId from SecureStore when app starts
  useEffect(() => {
    const loadUserId = async () => {
      try {
        const storedUserId = await SecureStore.getItemAsync("userId");
        if (storedUserId) {
          setUserId(storedUserId);
        }
      } catch (error) {
        console.error("Failed to load userId:", error);
      } finally {
        setLoading(false);
      }
    };
    loadUserId();
  }, []);

  return (
    <UserContext.Provider value={{ userId, setUserId, loading }}>
      {children}
    </UserContext.Provider>
  );
};
