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
  const [hasLoggedInOnce, setHasLoggedInOnce] = useState(false);

  /**
   * Lädt User-Daten aus SecureStore + decodiert token
   * Setzt userId, username und token im Context.
   */
  const loadUserData = async () => {
    try {
      const storedToken = await SecureStore.getItemAsync("authToken");
      const storedUserId = await SecureStore.getItemAsync("userId");

      if (storedUserId) {
        setUserId(storedUserId);
        setHasLoggedInOnce(true); // ✅ Wichtig: Session flag korrekt setzen!
      }

      if (storedToken) {
        setToken(storedToken);
        const decoded = jwtDecode(storedToken);
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

  /**
   * Für manuelles Neuladen nach Login
   */
  const reloadUser = async () => {
    setLoading(true);
    await loadUserData();
  };

  /**
   * Bei Logout alles löschen
   */
  const logoutUser = async () => {
    try {
      await SecureStore.deleteItemAsync("authToken");
      await SecureStore.deleteItemAsync("userId");
      setUserId(null);
      setUsername(null);
      setToken(null);
      setHasLoggedInOnce(false);
      setLoading(false);
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  /**
   * ✅ Nur EIN useEffect reicht völlig.
   * Der zweite mit `[hasLoggedInOnce]` ist überflüssig,
   * da du eh `loadUserData` beim ersten Mount aufrufst.
   */
  useEffect(() => {
    loadUserData();
  }, []);

  return (
    <UserContext.Provider
      value={{
        userId,
        setUserId,
        token,
        setToken,
        username,
        setUsername,
        logoutUser,
        reloadUser,
        loading,
        hasLoggedInOnce,
        setHasLoggedInOnce,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
