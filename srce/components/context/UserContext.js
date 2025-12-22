import React, { createContext, useContext, useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";
import { jwtDecode } from "jwt-decode";
import Constants from "expo-constants";
import { registerPushToken } from '../../notifications/registerPushToken';
import { setupNotifications } from "../../notifications/notifications";
import { API_URL } from '../../config/env'; // ✅ FIX

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

  // 🟩 Bringits
  const [bringits, setBringits] = useState(0);

  // 🟪 Auth ready flag
  const [authReady, setAuthReady] = useState(false);



  // ==========================================================
  // 🔵 Session sichern (Login)
  // ==========================================================
  const saveSession = async ({ accessToken, refreshToken }) => {
    await SecureStore.setItemAsync("accessToken", accessToken);
    await SecureStore.setItemAsync("refreshToken", refreshToken);

    setAccessToken(accessToken);
    setRefreshToken(refreshToken);
  };



  // ==========================================================
  // Session aus SecureStore laden (App-Start)
  const loadUserData = async () => {
    setLoading(true);
    setAuthReady(false);

    try {
      const [storedAccess, storedRefresh] = await Promise.all([
        SecureStore.getItemAsync("accessToken"),
        SecureStore.getItemAsync("refreshToken"),
      ]);

      if (!storedAccess) return;

      setAccessToken(storedAccess);
      if (storedRefresh) setRefreshToken(storedRefresh);

      const response = await fetch(`${API_URL}/api/users/me`, {
        headers: {
          Authorization: `Bearer ${storedAccess}`,
        },
      });

      if (!response.ok) return;

      const me = await response.json();
      setUserId(me.userId);
      setUsername(me.username);
      setBringits(me.bringIts);

      setAuthReady(true);
    } catch (err) {
      console.error("❌ Failed to load user session", err);
    } finally {
      setLoading(false);
    }
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
      setBringits(0);
      setHasLoggedInOnce(false);

    } catch (error) {
      console.error("Error during logout:", error);
    }
  };


  // ==========================================================
  // 🔥 App-Start
  // ==========================================================
  useEffect(() => {
    loadUserData();
    setupNotifications();
  }, []);


  // ==========================================================
  // 🔥 Logged-In
  // ==========================================================
  useEffect(() => {
    if (!authReady || !accessToken) return;

    registerPushToken(accessToken).catch(() => { });
  }, [authReady, accessToken]);



  // ==========================================================
  // 🔵 Group Reload System
  // ==========================================================
  const [groupsVersion, setGroupsVersion] = useState(0);

  // Trigger: whenever groups change
  const triggerGroupReload = () => {
    setGroupsVersion(v => v + 1);
  };


  return (
    <UserContext.Provider
      value={{
        userId,
        setUserId,
        username,
        setUsername,

        bringits,
        setBringits,

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

        // Group Reload System
        groupsVersion,
        triggerGroupReload,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};