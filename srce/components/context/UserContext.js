import React, { createContext, useContext, useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";
import { jwtDecode } from "jwt-decode";

const UserContext = createContext();
export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
  // 🟦 User Data
  const [userId, setUserId] = useState(null);
  const [username, setUsername] = useState(null);

  // 🟧 Tokens
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);

  // 🟨 Login flags
  const [loading, setLoading] = useState(true);
  const [hasLoggedInOnce, setHasLoggedInOnce] = useState(false);

  // ==========================================================
  // 🔵 Session sichern (Login)
  // ==========================================================
  const saveSession = async ({ userId, accessToken, refreshToken }) => {
    if (userId) {
      await SecureStore.setItemAsync("userId", String(userId));
      setUserId(userId);
    }

    if (accessToken) {
      await SecureStore.setItemAsync("accessToken", accessToken);
      setAccessToken(accessToken);

      try {
        const decoded = jwtDecode(accessToken);
        if (decoded?.sub) setUsername(decoded.sub);
      } catch (err) {
        console.warn("JWT decode failed:", err);
      }
    }

    if (refreshToken) {
      await SecureStore.setItemAsync("refreshToken", refreshToken);
      setRefreshToken(refreshToken);
    }

    setHasLoggedInOnce(true);
  };

  // ==========================================================
  // 🔥 Session aus SecureStore laden (App-Start)
  // ==========================================================
  const loadUserData = async () => {
    console.log("🔄 Loading session from SecureStore...");
    setLoading(true);

    try {
      const [storedAccess, storedRefresh, storedUserId] = await Promise.all([
        SecureStore.getItemAsync("accessToken"),
        SecureStore.getItemAsync("refreshToken"),
        SecureStore.getItemAsync("userId"),
      ]);

      console.log("🔍 Stored accessToken:", storedAccess);
      console.log("🔍 Stored refreshToken:", storedRefresh);
      console.log("🔍 Stored userId:", storedUserId);

      if (storedUserId) {
        setUserId(storedUserId);
        setHasLoggedInOnce(true);
      }

      if (storedAccess) {
        setAccessToken(storedAccess);

        try {
          const decoded = jwtDecode(storedAccess);
          if (decoded?.sub) setUsername(decoded.sub);
        } catch (err) {
          console.warn("JWT decode failed:", err);
        }
      }

      if (storedRefresh) {
        setRefreshToken(storedRefresh);
      }

    } catch (error) {
      console.error("❌ Failed to load user session:", error);
    }

    // WICHTIG ❗ Erst jetzt ist alles sicher geladen
    setLoading(false);
    console.log("✅ Session load completed.");
  };

  // ==========================================================
  // 🔁 Reload-Funktion
  // ==========================================================
  const reloadUser = async () => {
    await loadUserData();
  };

  // ==========================================================
  // 🧨 LOGOUT
  // ==========================================================
  const logoutUser = async () => {
    console.log("🚪 Logging out user...");

    try {
      await Promise.all([
        SecureStore.deleteItemAsync("accessToken"),
        SecureStore.deleteItemAsync("refreshToken"),
        SecureStore.deleteItemAsync("userId"),
      ]);

      setUserId(null);
      setUsername(null);
      setAccessToken(null);
      setRefreshToken(null);
      setHasLoggedInOnce(false);
    } catch (error) {
      console.error("Error during logout:", error);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // 🔥 App-Start
  // ==========================================================
  useEffect(() => {
    loadUserData();
  }, []);

  return (
    <UserContext.Provider
      value={{
        userId,
        setUserId,
        username,
        setUsername,

        accessToken,
        setAccessToken,
        refreshToken,
        setRefreshToken,

        saveSession,
        reloadUser,
        logoutUser,

        loading,
        hasLoggedInOnce,
        setHasLoggedInOnce,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};