import React, { createContext, useContext, useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";
import { jwtDecode } from "jwt-decode";
import Constants from "expo-constants";
import { registerPushToken } from '../../notifications/registerPushToken';
import { setupNotifications } from "../../notifications/notifications";
import { API_URL } from '../../config/env';

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
    try {
      setLoading(true);

      await SecureStore.setItemAsync("accessToken", accessToken);
      await SecureStore.setItemAsync("refreshToken", refreshToken);

      setAccessToken(accessToken);
      setRefreshToken(refreshToken);

      const response = await fetch(`${API_URL}/api/users/me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch /me after login");
      }

      const me = await response.json();
      setUserId(me.userId);
      setUsername(me.username);
      setBringits(me.bringIts);

      setAuthReady(true);
      setHasLoggedInOnce(true);
    } catch (err) {
      console.error("❌ Failed to save session", err);
      // ✅ WICHTIG: Bei Fehler Session clearen
      await clearSession();
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // Session aus SecureStore laden (App-Start)
  // ==========================================================
  const loadUserData = async () => {
    setLoading(true);

    try {
      const [storedAccess, storedRefresh] = await Promise.all([
        SecureStore.getItemAsync("accessToken"),
        SecureStore.getItemAsync("refreshToken"),
      ]);

      if (!storedAccess) {
        // ✅ Kein Token = nicht eingeloggt
        setAuthReady(true); // ✅ WICHTIG: authReady = true bedeutet "Auth-Status ist geklärt"
        return;
      }

      setAccessToken(storedAccess);
      if (storedRefresh) setRefreshToken(storedRefresh);

      const response = await fetch(`${API_URL}/api/users/me`, {
        headers: {
          Authorization: `Bearer ${storedAccess}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch /me");
      }

      const me = await response.json();
      setUserId(me.userId);
      setUsername(me.username);
      setBringits(me.bringIts);

      setAuthReady(true);
    } catch (err) {
      console.error("❌ Failed to load user session", err);
      // ✅ Bei Fehler Session clearen
      await clearSession();
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // 🧹 Session clearen (Helper)
  // ==========================================================
  const clearSession = async () => {
    try {
      await Promise.all([
        SecureStore.deleteItemAsync("accessToken"),
        SecureStore.deleteItemAsync("refreshToken"),
        SecureStore.deleteItemAsync("userId"),
      ]);
    } catch (err) {
      console.error("Error clearing session:", err);
    }

    setUserId(null);
    setUsername(null);
    setAccessToken(null);
    setRefreshToken(null);
    setBringits(0);
    setAuthReady(true); // ✅ Auth-Status ist geklärt (= nicht eingeloggt)
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
    setLoading(true);
    await clearSession();
    setHasLoggedInOnce(false);
    setLoading(false);
  };

  // ==========================================================
  // 🔥 App-Start
  // ==========================================================
  useEffect(() => {
    loadUserData();
  }, []);

  // ==========================================================
  // 🔥 Logged-In → Notifications
  // ==========================================================
  useEffect(() => {
    if (!authReady || !accessToken) return;

    setupNotifications();
    registerPushToken(accessToken).catch(() => { });
  }, [authReady, accessToken]);

  // ==========================================================
  // 🔵 Group Reload System
  // ==========================================================
  const [groupsVersion, setGroupsVersion] = useState(0);

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
        authReady, // ✅ Export authReady
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