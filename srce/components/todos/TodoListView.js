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
  StyleSheet,
} from "react-native";

import * as SecureStore
  from "expo-secure-store";

import {
  useIsFocused,
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

      <Text style={styles.emptyText}>
        Keine offenen Todos
      </Text>

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

    emptyText: {
      textAlign: "center",
      marginTop: 20,
      color: "#888",
      fontStyle: "italic",
    },

  });