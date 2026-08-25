import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";

import {
  FlatList,
  ActivityIndicator,
  Alert,
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

import * as SecureStore
  from "expo-secure-store";

import {
  useIsFocused,
  useNavigation,
} from "@react-navigation/native";

import Toast
  from "react-native-toast-message";

import CollapsibleTodoCard
  from "../CollapsibleTodoCard";

import {
  useNetwork,
} from "../context/NetworkContext";

import {
  API_URL,
} from "../../config/env";

import { Icons } from "../../ui/icons";


export default function TodoListView({
  openTodoId = null,
}) {

  const [todos, setTodos] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const listRef =
    useRef(null);

  const isFocused =
    useIsFocused();

  const navigation =
    useNavigation();

  const {
    safeFetch,
  } = useNetwork();


  const handleLocalTodoUpdate =
    (todoId) => {

      setTodos(
        prev =>
          prev.filter(
            t =>
              t.todoId !== todoId
          )
      );


      setTimeout(
        () => fetchTodos(),
        1500
      );
    };


  const formatLocalDateTime =
    (isoString) => {

      if (!isoString) {
        return "";
      }

      const date =
        new Date(isoString);


      return date.toLocaleString(
        "de-DE",
        {
          hour12: false,
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }
      );
    };


  const fetchTodos =
    useCallback(async () => {

      try {

        setLoading(true);


        const token =
          await SecureStore.getItemAsync(
            "accessToken"
          );


        if (!token) {

          Alert.alert(
            "Nicht eingeloggt",
            "Bitte logge dich ein."
          );

          return;
        }


        const response =
          await safeFetch(
            `${API_URL}/api/todo/open`,
            {
              method: "GET",

              headers: {
                Authorization:
                  `Bearer ${token}`,

                "Content-Type":
                  "application/json",
              },
            }
          );


        if (response?.offline) {

          Toast.show({
            type: "info",
            text1: "Offline",
            text2:
              "Keine Internetverbindung",
          });

          return;
        }


        if (!response.ok) {

          const errText =
            await response
              .text?.()
              .catch(
                () => ""
              );


          console.warn(
            "Fehler beim Laden der Todos:",
            errText
          );


          Alert.alert(
            "Fehler",
            "Todos konnten nicht geladen werden."
          );

          return;
        }


        const data =
          await response.json();


        const filtered =
          (
            Array.isArray(data)
              ? data
              : []
          ).filter(
            todo =>
              !todo.deletedAt &&
              (
                !todo.status ||
                todo.status
                  .toUpperCase() ===
                "OFFEN"
              )
          );


        const normalized =
          filtered.map(
            todo => ({
              ...todo,

              expiresAtLocal:
                formatLocalDateTime(
                  todo.expiresAt
                ),
            })
          );


        setTodos(
          normalized
        );


      } catch (error) {

        console.error(
          "Fehler beim Laden der Todos:",
          error
        );


        Alert.alert(
          "Fehler",
          "Todos konnten nicht geladen werden."
        );


      } finally {

        setLoading(false);
      }

    }, [safeFetch]);


  useEffect(() => {

    if (isFocused) {
      fetchTodos();
    }

  }, [
    isFocused,
    fetchTodos,
  ]);


  // =========================================================
  // SCROLL TO TODO FROM MAP
  // =========================================================

  useEffect(() => {

    if (
      !openTodoId ||
      todos.length === 0
    ) {
      return;
    }


    const index =
      todos.findIndex(
        todo =>
          String(todo.todoId) ===
          String(openTodoId)
      );


    if (index < 0) {
      return;
    }


    const timeout =
      setTimeout(() => {

        listRef.current
          ?.scrollToIndex({
            index,
            animated: true,
            viewPosition: 0.15,
          });

      }, 250);


    return () =>
      clearTimeout(timeout);


  }, [
    openTodoId,
    todos,
  ]);


  if (loading) {

    return (

      <ActivityIndicator
        size="large"
        color="#888"
        style={
          styles.centered
        }
      />

    );
  }


  if (todos.length === 0) {

    return (

      <View style={styles.emptyContainer}>

        <View style={styles.emptyIconCircle}>
          <Icons.Handshake
            size={28}
            color="#3FA9AB"
          />
        </View>

        <Text style={styles.emptyTitle}>
          Noch ist es still hier
        </Text>

        <Text style={styles.emptySubtitle}>
          Erstelle das erste Todo in deiner Umgebung
          oder lade Nachbarn ein, mitzumachen.
        </Text>

        <TouchableOpacity
          style={styles.emptyButton}
          activeOpacity={0.85}
          onPress={() =>
            navigation.navigate("Todo erstellen")
          }
        >
          <Icons.PlusCircle size={16} color="#FFFFFF" />
          <Text style={styles.emptyButtonText}>
            Todo erstellen
          </Text>
        </TouchableOpacity>

      </View>

    );
  }


  return (

    <FlatList
      ref={listRef}

      data={todos}

      keyExtractor={(
        item,
        index
      ) =>
        item?.todoId
          ? String(item.todoId)
          : String(index)
      }

      renderItem={({
        item,
      }) => (

        <CollapsibleTodoCard
          todo={item}

          onStatusUpdated={() =>
            handleLocalTodoUpdate(
              item.todoId
            )
          }

          forceExpanded={
            openTodoId != null &&
            String(item.todoId) ===
            String(openTodoId)
          }
        />

      )}

      onScrollToIndexFailed={(
        info
      ) => {

        listRef.current
          ?.scrollToOffset({
            offset:
              info.averageItemLength *
              info.index,

            animated: true,
          });


        setTimeout(() => {

          listRef.current
            ?.scrollToIndex({
              index: info.index,
              animated: true,
              viewPosition: 0.15,
            });

        }, 300);
      }}
    />

  );
}


const styles =
  StyleSheet.create({

    centered: {
      marginTop: 40,
    },

    emptyContainer: {
      alignItems: "center",
      paddingHorizontal: 32,
      paddingTop: 56,
    },

    emptyIconCircle: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: "#E7F6F6",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 18,
    },

    emptyTitle: {
      fontSize: 20,
      fontWeight: "800",
      color: "#12151A",
      marginBottom: 8,
      textAlign: "center",
    },

    emptySubtitle: {
      fontSize: 16,
      color: "#6B7280",
      textAlign: "center",
      lineHeight: 20,
      marginBottom: 24,
    },

    emptyButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#3FA9AB",
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 999,
      gap: 8,

      shadowColor: "#3FA9AB",
      shadowOpacity: 0.25,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 3,
    },

    emptyButtonText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "700",
    },

  });