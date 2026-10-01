import React, { createContext, useContext, useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";
import { registerPushToken } from '../../notifications/registerPushToken';
import { setupNotifications } from "../../notifications/notifications";
//import { API_URL } from "../../../config/env";
import { API_URL, APP_ENV } from "../../config/env";
import { fetchWithTimeout } from "../../utils/fetchWithTimeout";


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

  // 🟫 Session error
  const [sessionError, setSessionError] = useState(null);

  const invalidSessionError = () => {
    const error = new Error("Deine Sitzung ist abgelaufen.");
    error.code = "INVALID_SESSION";
    return error;
  };

  const refreshAccessToken = async () => {
    // SecureStore verwenden, damit kein alter React-State benutzt wird.
    const rt = await SecureStore.getItemAsync("refreshToken");
    if (!rt) throw invalidSessionError();

    const res = await fetchWithTimeout(`${API_URL}/api/user/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: rt }),
    });

    const text = await res.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }

    if (
      res.status === 401 &&
      data?.code === "INVALID_REFRESH_TOKEN"
    ) {
      throw invalidSessionError();
    }

    if (!res.ok) {
      throw new Error(`Refresh failed (${res.status})`);
    }

    if (
      typeof data?.accessToken !== "string" ||
      !data.accessToken
    ) {
      throw new Error("Invalid refresh response");
    }

    await SecureStore.setItemAsync("accessToken", data.accessToken);

    if (data.refreshToken) {
      await SecureStore.setItemAsync("refreshToken", data.refreshToken);
      setRefreshToken(data.refreshToken);
    }

    setAccessToken(data.accessToken);
    return data.accessToken;
  };

  const fetchMeWithAutoRefresh = async () => {
    let at = await SecureStore.getItemAsync("accessToken");

    if (!at) {
      at = await refreshAccessToken();
    }

    const requestMe = (token) =>
      fetchWithTimeout(`${API_URL}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

    let res = await requestMe(at);

    // 403 vorerst beibehalten: Dein bisheriges Backend kann
    // diesen Status auch bei fehlender Authentifizierung liefern.
    if (res.status === 401 || res.status === 403) {
      const newAccess = await refreshAccessToken();
      res = await requestMe(newAccess);

      if (res.status === 401) {
        throw invalidSessionError();
      }
    }

    return res;
  };



  // ==========================================================
  // 🔵 Session sichern (Login)
  // ==========================================================
  const saveSession = async ({ accessToken, refreshToken }) => {
    try {
      setLoading(true);
      setSessionError(null);

      await SecureStore.setItemAsync("accessToken", accessToken);
      await SecureStore.setItemAsync("refreshToken", refreshToken);

      setAccessToken(accessToken);
      setRefreshToken(refreshToken);

      const response = await fetchMeWithAutoRefresh();

      if (!response.ok) {
        throw new Error("Failed to fetch /me after login");
      }

      const me = await response.json();

      if (me.userId == null) {
        throw new Error("Profile response contains no userId");
      }

      setUserId(me.userId);
      setUsername(me.username);
      setBringits(me.bringIts);

      setHasLoggedInOnce(true);
    } catch (err) {
      console.error("Session load failed:", err);

      if (err.code === "INVALID_SESSION") {
        await clearSession();
      } else {
        setSessionError(
          "Deine Sitzung konnte nicht geladen werden. Bitte versuche es erneut."
        );
      }

      throw err;
    }
    finally {
      setAuthReady(true);
      setLoading(false);
    }
  };

  // ==========================================================
  // Session aus SecureStore laden (App-Start)
  // ==========================================================
  const loadUserData = async () => {
    setLoading(true);
    setSessionError(null);

    try {
      const [storedAccess, storedRefresh] = await Promise.all([
        SecureStore.getItemAsync("accessToken"),
        SecureStore.getItemAsync("refreshToken"),
      ]);

      if (!storedAccess && !storedRefresh) {
        await clearSession();
        return;
      }

      setHasLoggedInOnce(true);

      setAccessToken(storedAccess);
      setRefreshToken(storedRefresh);

      const response = await fetchMeWithAutoRefresh();

      if (!response.ok) {
        throw new Error("Failed to fetch /me");
      }

      const me = await response.json();

      if (me.userId == null) {
        throw new Error("Profile response contains no userId");
      }
      setUserId(me.userId);
      setUsername(me.username);
      setBringits(me.bringIts);

      //setAuthReady(true);
    } catch (err) {
      console.error("Session load failed:", err);

      if (err.code === "INVALID_SESSION") {
        await clearSession();
      } else {
        setSessionError(
          "Deine Sitzung konnte nicht geladen werden. " +
          "Bitte prüfe deine Verbindung und versuche es erneut."
        );
      }
    }
    finally {
      setAuthReady(true);
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
    setHasLoggedInOnce(false);
    setSessionError(null);
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
  /* CRASH VERURSACHER?? darf nicht hier rein
  useEffect(() => {
    if (!authReady || !accessToken) return;

    setupNotifications();
    registerPushToken(accessToken).catch(() => { });
  }, [authReady, accessToken]);
*/
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

        sessionError,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};