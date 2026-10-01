import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import NetInfo from "@react-native-community/netinfo";
import * as SecureStore from "expo-secure-store";
import { useUser } from "./UserContext";
import { API_URL, APP_ENV } from "../../config/env";
import { fetchWithTimeout } from "../../utils/fetchWithTimeout";


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
      "/api/user/username-available",
      "/api/user/register",
    ];

    return publicPaths.includes(pathname);
  };

  // ==========================================================
  // 🔥 REFRESH TOKEN FLOW
  // ==========================================================
  const performRefresh = async () => {
    if (isRefreshing.current) {
      return new Promise((resolve, reject) => {
        refreshQueue.current.push({ resolve, reject });
      });
    }

    isRefreshing.current = true;

    try {
      const rt = await SecureStore.getItemAsync("refreshToken");

      if (!rt) {
        await logoutUser();

        const error = new Error("No refresh token");
        error.code = "INVALID_SESSION";
        throw error;
      }

      const response = await fetchWithTimeout(
        `${API_URL}/api/user/auth/refresh`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: rt }),
        }
      );

      const text = await response.text();

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = null;
      }

      if (
        response.status === 401 &&
        data?.code === "INVALID_REFRESH_TOKEN"
      ) {
        await logoutUser();

        const error = new Error("Invalid refresh token");
        error.code = "INVALID_SESSION";
        throw error;
      }

      if (!response.ok) {
        throw new Error(`Refresh failed (${response.status})`);
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

      refreshQueue.current.forEach(p => p.resolve(data.accessToken));
      refreshQueue.current = [];

      return data.accessToken;
    } catch (err) {
      refreshQueue.current.forEach(p => p.reject(err));
      refreshQueue.current = [];
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
    console.log("➡️ [safeFetch] Tokens vorhanden:", {
      accessToken: Boolean(accessToken),
      refreshToken: Boolean(refreshToken),
    });

    if (!isConnected) {
      return { ok: false, offline: true, status: 0 };
    }

    try {
      // Öffentliche Requests benötigen keinen Token.
      if (isPublicRequest(url)) {
        return await attemptFetch(url, options);
      }

      let token = await SecureStore.getItemAsync("accessToken");

      if (!token) {
        token = await performRefresh();
      }

      const finalOptions = {
        ...options,
        headers: {
          ...(options.headers || {}),
          Authorization: `Bearer ${token}`,
        },
      };

      const response = await attemptFetch(url, finalOptions);

      console.log("🔎 Response Status:", response.status);

      // 403 vorerst ebenfalls behandeln, weil dein bisheriges
      // Backend ihn auch bei fehlender Authentifizierung liefern kann.
      if (response.status !== 401 && response.status !== 403) {
        return response;
      }

      console.log("🔄 [safeFetch] Versuche Token-Refresh");

      const newAccess = await performRefresh();

      const retryOptions = {
        ...options,
        headers: {
          ...(options.headers || {}),
          Authorization: `Bearer ${newAccess}`,
        },
      };

      const retryResponse = await attemptFetch(url, retryOptions);

      console.log("🔎 Response nach Refresh:", retryResponse.status);

      // Kein weiterer Refresh: höchstens ein erneuter Versuch.
      return retryResponse;
    } catch (err) {

      if (err.code === "INVALID_SESSION") {
        return { ok: false, status: 401 };
      }
      console.error("❌ [safeFetch] Fehler:", err.message);

      throw err;
    }
  };

  // ==========================================================
  // SMALL HELPER
  // ==========================================================
  const attemptFetch = async (url, options) => {
    try {
      return await fetchWithTimeout(url, options);
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
