import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";

import {
  useFocusEffect,
  useNavigation,
} from "@react-navigation/native";

import ViewModeToggle
  from "../components/todos/ViewModeToggle";

import TodoListView
  from "../components/todos/TodoListView";

import TodoMapView
  from "../components/todos/TodoMapView";

import {
  getStoredViewMode,
  setStoredViewMode,
} from "../utils/viewModePreference";

import {
  useUser,
} from "../components/context/UserContext";

import {
  useNetwork,
} from "../components/context/NetworkContext";

import {
  API_URL,
} from "../config/env";


export default function OpenTodosScreen() {

  const navigation =
    useNavigation();

  const {
    userId,
    accessToken,
  } = useUser();

  const {
    safeFetch,
  } = useNetwork();


  const [mode, setMode] =
    useState("map");

  const [preferenceLoaded, setPreferenceLoaded] =
    useState(false);

  const [selectedTodoId, setSelectedTodoId] =
    useState(null);

  const [hasAddress, setHasAddress] =
    useState(null);

  const [checkingAddress, setCheckingAddress] =
    useState(true);


  useEffect(() => {

    (async () => {

      const stored =
        await getStoredViewMode();

      if (stored) {
        setMode(stored);
      }

      setPreferenceLoaded(true);

    })();

  }, []);


  /*
   * Prüft, ob der aktuelle User
   * eine vollständige Profiladresse hat.
   *
   * Wird bei jedem Fokus erneut ausgeführt,
   * damit nach dem Speichern im Profil
   * sofort Liste/Map freigeschaltet werden.
   */
  const checkUserAddress =
    useCallback(async () => {

      if (
        !userId ||
        !accessToken
      ) {
        setHasAddress(false);
        setCheckingAddress(false);
        return;
      }


      try {

        setCheckingAddress(true);

        const response =
          await safeFetch(
            `${API_URL}/api/users/profile/${userId}`,
            {
              method: "GET",
              headers: {
                Authorization:
                  `Bearer ${accessToken}`,

                "Content-Type":
                  "application/json",
              },
            }
          );


        if (
          response?.offline ||
          !response?.ok
        ) {
          return;
        }


        const data =
          await response.json();


        const address =
          data?.address;


        const addressIsComplete =
          !!address &&
          address.latitude != null &&
          address.longitude != null;


        setHasAddress(
          addressIsComplete
        );

      } catch (error) {

        console.error(
          "Fehler beim Prüfen der Profiladresse:",
          error
        );

      } finally {

        setCheckingAddress(false);
      }

    }, [
      userId,
      accessToken,
      safeFetch,
    ]);


  useFocusEffect(
    useCallback(() => {

      checkUserAddress();

    }, [
      checkUserAddress,
    ])
  );


  const handleModeChange =
    (newMode) => {

      setMode(newMode);

      setStoredViewMode(
        newMode
      );


      if (newMode === "map") {
        setSelectedTodoId(null);
      }
    };


  const handleOpenTodoFromMap =
    (todoId) => {

      setSelectedTodoId(
        todoId
      );

      setMode(
        "list"
      );

      setStoredViewMode(
        "list"
      );
    };


  const handleAddAddress =
    () => {

      navigation.navigate(
        "ProfileScreen",
        {
          openAddressSetup: true,
        }
      );
    };


  if (
    !preferenceLoaded ||
    checkingAddress
  ) {

    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="small"
          color="#4FB6B8"
        />
      </View>
    );
  }


  /*
   * Ohne Profiladresse:
   * keine Map und keine Liste anzeigen.
   */
  if (!hasAddress) {

    return (

      <View style={styles.container}>

        <Text style={styles.headerTitle}>
          Offene Todos
        </Text>


        <View style={styles.addressRequiredContainer}>

          <View style={styles.addressIconCircle}>
            <Text style={styles.addressIcon}>
              📍
            </Text>
          </View>


          <Text style={styles.addressRequiredTitle}>
            Entdecke Todos in deiner Nähe
          </Text>


          <Text style={styles.addressRequiredText}>
            Hinterlege deine Profiladresse,
            damit wir dir offene Todos im
            Umkreis von 10 km zeigen können.
          </Text>


          <Text style={styles.addressPrivacyText}>
            Deine genaue Adresse bleibt geschützt.
          </Text>


          <TouchableOpacity
            style={styles.addressButton}
            onPress={handleAddAddress}
            activeOpacity={0.85}
          >
            <Text style={styles.addressButtonText}>
              Adresse hinzufügen
            </Text>
          </TouchableOpacity>

        </View>

      </View>
    );
  }


  return (

    <View style={styles.container}>

      <Text style={styles.headerTitle}>
        Offene Todos
      </Text>


      <ViewModeToggle
        mode={mode}
        onChange={handleModeChange}
      />


      <View style={styles.content}>

        {mode === "map" ? (

          <TodoMapView
            onOpenTodo={
              handleOpenTodoFromMap
            }
          />

        ) : (

          <TodoListView
            openTodoId={
              selectedTodoId
            }
          />

        )}

      </View>

    </View>
  );
}


const styles =
  StyleSheet.create({

    container: {
      flex: 1,
      paddingTop: 30,
      backgroundColor: "#F7F7F7",
    },

    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#F7F7F7",
    },

    headerTitle: {
      fontSize: 28,
      fontWeight: "800",
      color: "#12151A",
      letterSpacing: -0.5,
      textAlign: "center",
      paddingBottom: 12,
    },

    content: {
      flex: 1,
      paddingHorizontal: 16,
    },

    addressRequiredContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 34,
      paddingBottom: 70,
    },

    addressIconCircle: {
      width: 76,
      height: 76,
      borderRadius: 38,
      backgroundColor: "#EAF7F7",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 22,
    },

    addressIcon: {
      fontSize: 32,
    },

    addressRequiredTitle: {
      fontSize: 21,
      fontWeight: "800",
      color: "#12151A",
      textAlign: "center",
      marginBottom: 10,
    },

    addressRequiredText: {
      fontSize: 15,
      lineHeight: 22,
      color: "#62676D",
      textAlign: "center",
      maxWidth: 330,
    },

    addressPrivacyText: {
      marginTop: 8,
      fontSize: 13,
      color: "#8A8F95",
      textAlign: "center",
    },

    addressButton: {
      marginTop: 24,
      minHeight: 48,
      paddingHorizontal: 24,
      borderRadius: 12,
      backgroundColor: "#4FB6B8",
      justifyContent: "center",
      alignItems: "center",
    },

    addressButtonText: {
      color: "#FFFFFF",
      fontSize: 15,
      fontWeight: "700",
    },

  });