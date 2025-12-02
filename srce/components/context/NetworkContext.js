import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import NetInfo from "@react-native-community/netinfo";
import * as SecureStore from "expo-secure-store";
import { useUser } from "./UserContext";
import { API_URL } from '@env';

const NetworkContext = createContext({ isConnected: true });

export const NetworkProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(true);

  const {
    accessToken,
    refreshToken,
    setAccessToken,
    setRefreshToken,
    logoutUser,
  } = useUser();

  const isRefreshing = useRef(false);
  const refreshQueue = useRef([]);

  // ==========================================================
  // 🌐 MONITOR INTERNET
  // ==========================================================
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  // ==========================================================
  // 🌐 PUBLIC REQUESTS (OHNE TOKEN)
  // ==========================================================
  const isPublicRequest = (url) => {
    let pathname;

    try {
      pathname = new URL(url).pathname;
    } catch {
      pathname = url;
    }

    const publicPaths = [
      "/api/user/auth/login",
      "/api/user/auth/reset-password",
      "/api/user/auth/set-new-password",
      "/api/user/auth/refresh",
      "/api/user/signup",
      "/api/user/register",
    ];

    return publicPaths.includes(pathname);
  };

  // ==========================================================
  // 🔥 REFRESH TOKEN FLOW
  // ==========================================================
  const performRefresh = async () => {
    if (isRefreshing.current) {
      // parallele Refresh-Requests warten
      return new Promise((resolve, reject) => {
        refreshQueue.current.push({ resolve, reject });
      });
    }

    isRefreshing.current = true;

    try {
      console.log("🔥 [performRefresh] START");
      console.log("🔥 [performRefresh] refreshToken in context:", refreshToken);

      // RefreshToken holen (Context oder SecureStore)
      let rt = refreshToken;
      if (!rt) {
        rt = await SecureStore.getItemAsync("refreshToken");
      }
      console.log("🔥 [performRefresh] refreshToken in SecureStore:", rt);

      if (!rt) {
        console.error("❌ Kein RefreshToken vorhanden – kann nicht refreshen.");
        logoutUser();
        throw new Error("No refresh token");
      }

      console.log("🔥 [performRefresh] SENDING refreshToken TO BACKEND:", rt);

      const response = await fetch(
        `${API_URL}/api/user/auth/refresh`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: rt }),
        }
      );

      console.log("🔥 [performRefresh] REFRESH RESPONSE STATUS:", response.status);

      const responseText = await response.text();
      console.log("🔥 [performRefresh] REFRESH RESPONSE BODY:", responseText);

      // ⬇️ WICHTIG: nur bei 200 JSON parsen
      if (response.status !== 200) {
        throw new Error("Refresh failed: " + responseText);
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error("❌ JSON parse error im Refresh:", e);
        throw new Error("Invalid JSON from refresh endpoint");
      }

      const newAccess = data.accessToken;
      const newRefresh = data.refreshToken;

      console.log("✅ [performRefresh] newAccess:", newAccess);
      console.log("✅ [performRefresh] newRefresh:", newRefresh);

      // Tokens speichern
      await SecureStore.setItemAsync("accessToken", newAccess);
      await SecureStore.setItemAsync("refreshToken", newRefresh);

      setAccessToken(newAccess);
      setRefreshToken(newRefresh);

      // wartende Requests auflösen
      refreshQueue.current.forEach((p) => p.resolve(newAccess));
      refreshQueue.current = [];

      return newAccess;

    } catch (err) {
      console.error("❌ [performRefresh] ERROR:", err);

      refreshQueue.current.forEach((p) => p.reject(err));
      refreshQueue.current = [];

      logoutUser();
      throw err;

    } finally {
      isRefreshing.current = false;
    }
  };

  // ==========================================================
  // 🔥 SAFE FETCH (MIT TOKEN + REFRESH)
  // ==========================================================

  const safeFetch = async (url, options = {}) => {
    console.log("➡️ [safeFetch] CALLED:", url);
    console.log("➡️ [safeFetch] accessToken (context):", accessToken);
    console.log("➡️ [safeFetch] refreshToken (context):", refreshToken);

    if (!isConnected) {
      return { ok: false, offline: true, status: 0 };
    }

    // Öffentliche Requests → kein Token nötig
    if (isPublicRequest(url)) {
      const res = await fetch(url, options);
      return res;
    }

    // AccessToken holen
    let token =
      accessToken ??
      (await SecureStore.getItemAsync("accessToken")) ??
      null;

    if (!token) {
      console.log("⚠️ Kein AccessToken → 401");
      return { ok: false, noToken: true, status: 401 };
    }

    // Request mit Token senden
    const finalOptions = {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
      },
    };

    let response = await attemptFetch(url, finalOptions);

    console.log("🔎 Response Status:", response.status);

    // Nur bei 401 + 403 refreshen
    if (response.status !== 401 && response.status !== 403) {
      return response;
    }

    console.log("🔄 AccessToken expired → REFRESHING…");

    // REFRESH versuchen
    try {
      const newAccess = await performRefresh();

      // Retry Request NUR mit neuem Token
      const retryOptions = {
        ...options,
        headers: {
          ...(options.headers || {}),
          Authorization: `Bearer ${newAccess}`,
        },
      };

      return await attemptFetch(url, retryOptions);
    } catch (err) {
      console.error("❌ Refresh failed → logout");
      return { ok: false, status: 401 };
    }
  };

  // ==========================================================
  // SMALL HELPER
  // ==========================================================
  const attemptFetch = async (url, options) => {
    try {
      return await fetch(url, options);
    } catch (err) {
      if (err.message === "Network request failed") {
        return { ok: false, offline: true, status: 0 };
      }
      throw err;
    }
  };

  return (
    <NetworkContext.Provider
      value={{
        isConnected,
        safeFetch,
        shouldShowError: () => isConnected,
      }}
    >
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = () => useContext(NetworkContext);
