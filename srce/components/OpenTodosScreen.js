import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Text,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import CollapsibleTodoCard from "../components/CollapsibleTodoCard";
import { useIsFocused } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import { useNetwork } from "../components/context/NetworkContext"; // ✅ safeFetch importiert
import Constants from "expo-constants";

const API_URL = Constants.expoConfig.extra.API_URL;

export default function OpenTodosScreen() {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const isFocused = useIsFocused();

  const { safeFetch } = useNetwork(); // ✅ Zugriff auf safeFetch

  // 🧹 Entfernt Todo lokal, wenn Status geändert oder gelöscht wurde
  const handleLocalTodoUpdate = (todoId) => {
    setTodos((prevTodos) => prevTodos.filter((t) => t.todoId !== todoId));
    setTimeout(() => fetchTodos(), 1500);
  };

  // 🧠 Hilfsfunktion zur Formatierung von Ablaufdaten
  const formatLocalDateTime = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleString("de-DE", {
      timeZone: "Europe/Berlin",
      hour12: false,
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // 📦 Todos abrufen (mit safeFetch)
  const fetchTodos = useCallback(async () => {
    try {
      setLoading(true);
      const token = await SecureStore.getItemAsync("accessToken");
      if (!token) {
        Alert.alert("Nicht eingeloggt", "Bitte logge dich ein.");
        setLoading(false);
        return;
      }

      // ✅ safeFetch statt fetch()
      const response = await safeFetch(
        `${API_URL}/api/todo/group`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      // ✅ Offline-Prüfung
      if (response?.offline) {
        Toast.show({
          type: 'info',
          text1: 'Offline',
          text2: 'Keine Internetverbindung',
        });
        setLoading(false);
        return;
      }

      // ✅ Serverfehler prüfen
      if (!response.ok) {
        const errText = await response.text?.().catch(() => "");
        console.warn("❌ Fehler beim Laden der Todos:", errText);
        Alert.alert("Fehler", "Todos konnten nicht geladen werden.");
        setLoading(false);
        return;
      }

      // ✅ Erfolgreiche Antwort
      const data = await response.json();
      console.log("📦 fetched todos:", data);

      // ✅ Nur offene & nicht gelöschte Todos behalten
      const filtered = (Array.isArray(data) ? data : []).filter(
        (todo) =>
          !todo.deletedAt &&
          (!todo.status || todo.status.toUpperCase() === "OFFEN")
      );

      // ✅ Ablaufzeit lokal formatieren
      const normalized = filtered.map((todo) => ({
        ...todo,
        expiresAtLocal: formatLocalDateTime(todo.expiresAt),
      }));

      setTodos(normalized);
    } catch (error) {
      console.error("❌ Fehler beim Laden der Todos:", error);
      Alert.alert("Fehler", "Todos konnten nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  }, [safeFetch]);

  // 🔁 Refetch bei Fokus
  useEffect(() => {
    if (isFocused) {
      fetchTodos();
    }
  }, [isFocused, fetchTodos]);

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Offene Todos</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#888" />
      ) : todos.length === 0 ? (
        <Text style={styles.emptyText}>Keine offenen Todos</Text>
      ) : (
        <FlatList
          data={todos}
          keyExtractor={(item, index) =>
            item?.todoId ? String(item.todoId) : String(index)
          }
          renderItem={({ item }) => (
            <CollapsibleTodoCard
              todo={item}
              onStatusUpdated={() => handleLocalTodoUpdate(item.todoId)}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    marginTop: 30,
    backgroundColor: "#F7F7F7",
  },
  headerTitle: {
    fontSize: 26,
    color: "#333",
    textAlign: "center",
    marginBottom: 10,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 20,
    color: "#888",
    fontStyle: "italic",
  },
});
