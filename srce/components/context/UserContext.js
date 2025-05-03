import React, { createContext, useContext, useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";
import { jwtDecode } from "jwt-decode";

const UserContext = createContext();

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
  const [userId, setUserId] = useState(null);
  const [username, setUsername] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  const loadUserData = async () => {
    try {
      const token = await SecureStore.getItemAsync("authToken");
      const storedUserId = await SecureStore.getItemAsync("userId");
      
      if (storedUserId) {
        setUserId(storedUserId);
      }

      if (token) {
        setToken(token)
        const decoded = jwtDecode(token);
        if (decoded.sub) {
          setUsername(decoded.sub);
        }
      }
    } catch (error) {
      console.error("Failed to load user data:", error);
    } finally {
      setLoading(false);
    }
  };

  // expose reloadUser to be called after login
  const reloadUser = async () => {
    setLoading(true);
    await loadUserData();
  };

  const logoutUser = async () => {
    try {
      await SecureStore.deleteItemAsync("authToken");
      await SecureStore.deleteItemAsync("userId");

      setUserId(null);
      setUsername(null);
      setLoading(false);
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  useEffect(() => {
    loadUserData();
  }, []);

  return (
    <UserContext.Provider value={{ userId, setUserId, token, setToken, username, setUsername, logoutUser, reloadUser, loading }}>
      {children}
    </UserContext.Provider>
  );
};
