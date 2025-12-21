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


  // ==========================================================
  // 🔵 Session sichern (Login)
  // ==========================================================
  const saveSession = async ({ accessToken, refreshToken }) => {
    if (accessToken) {
      await SecureStore.setItemAsync("accessToken", accessToken);
      setAccessToken(accessToken);
    }

    if (refreshToken) {
      await SecureStore.setItemAsync("refreshToken", refreshToken);
      setRefreshToken(refreshToken);
    }

    setHasLoggedInOnce(true);

    // 🔥 WICHTIG: User-Zustand IMMER aus der DB holen
    await loadUserData();
  };


  // ==========================================================
  // Session aus SecureStore laden (App-Start)
  // ==========================================================
  const loadUserData = async () => {
    console.log("🔄 Loading session from SecureStore...");
    setLoading(true);

    try {
      const [storedAccess, storedRefresh] = await Promise.all([
        SecureStore.getItemAsync("accessToken"),
        SecureStore.getItemAsync("refreshToken"),
      ]);

      console.log("Stored accessToken:", storedAccess);
      console.log("Stored refreshToken:", storedRefresh);

      if (storedAccess) {
        setAccessToken(storedAccess);

        const response = await fetch(`${API_URL}/api/users/me`, {
          headers: {
            Authorization: `Bearer ${storedAccess}`,
          },
        });

        if (response.ok) {
          const me = await response.json();
          console.log("Loaded /me data:", me);

          setUserId(me.userId);
          setUsername(me.username);
          setBringits(me.bringIts);
        } else {
          console.warn("Failed to load /me endpoint");
        }
      }

      if (storedRefresh) {
        setRefreshToken(storedRefresh);
      }
    } catch (error) {
      console.error("❌ Failed to load user session:", error);
    } finally {
      setLoading(false); // ✅ wirklich garantiert am Ende
      console.log("Session load completed.");
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
  if (!accessToken) return;

  console.log('🔔 Registering push token...');

  registerPushToken(API_URL, accessToken)
    .then(() => console.log('✅ Push token registered'))
    .catch(err => console.error('❌ Push token failed', err));

}, [accessToken]);


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