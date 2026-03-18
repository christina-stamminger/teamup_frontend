import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { useUser } from "./UserContext";
import { useNetwork } from "./NetworkContext";
import { API_URL } from "../../config/env";

const GroupContext = createContext(null);

export function GroupProvider({ children }) {
  const { userId, accessToken } = useUser();
  const { safeFetch } = useNetwork();

  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [loadingGroups, setLoadingGroups] = useState(false);

  const getAuthToken = useCallback(async () => {
    if (accessToken) return accessToken;
    return await SecureStore.getItemAsync("accessToken");
  }, [accessToken]);

  const refreshGroups = useCallback(async () => {
    if (!userId) {
      setGroups([]);
      setSelectedGroupId(null);
      return;
    }

    try {
      setLoadingGroups(true);
      const token = await getAuthToken();

      const response = await safeFetch(`${API_URL}/api/groups/myGroups`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response?.offline) {
        return { offline: true };
      }

      if (!response?.ok) {
        throw new Error("Fehler beim Laden der Gruppen");
      }

      const data = await response.json();

      const formatted = data.map((g) => ({
        label: g.groupName,
        value: g.groupId,
      }));

      setGroups(formatted);

      setSelectedGroupId((prev) => {
        const prevStillExists = formatted.some((g) => g.value === prev);
        if (prevStillExists) return prev;
        return formatted[0]?.value ?? null;
      });

      return { ok: true, groups: formatted };
    } catch (error) {
      console.error("refreshGroups error:", error);
      return { ok: false, error };
    } finally {
      setLoadingGroups(false);
    }
  }, [userId, getAuthToken, safeFetch]);

  const value = useMemo(() => ({
    groups,
    selectedGroupId,
    setSelectedGroupId,
    loadingGroups,
    refreshGroups,
  }), [groups, selectedGroupId, loadingGroups, refreshGroups]);

  return (
    <GroupContext.Provider value={value}>
      {children}
    </GroupContext.Provider>
  );
}

export function useGroups() {
  const context = useContext(GroupContext);
  if (!context) {
    throw new Error("useGroups must be used within a GroupProvider");
  }
  return context;
}