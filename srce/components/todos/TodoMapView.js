import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
} from "react-native";

import Mapbox from "@rnmapbox/maps";
import * as SecureStore from "expo-secure-store";
import { useIsFocused } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import { Feather } from "@expo/vector-icons";

import { useNetwork } from "../context/NetworkContext";
import { useUser } from "../context/UserContext";
import { API_URL } from "../../config/env";


const SEARCH_RADIUS_METERS = 10000;
const DEFAULT_ZOOM_LEVEL = 13;


export default function TodoMapView({
  onOpenTodo,
}) {

  const [nearbyTodos, setNearbyTodos] =
    useState([]);

  const [homeLocation, setHomeLocation] =
    useState(null);

  const [selectedTodo, setSelectedTodo] =
    useState(null);

  const [loadingTodos, setLoadingTodos] =
    useState(true);

  const [error, setError] =
    useState(null);


  const isFocused =
    useIsFocused();

  const cameraRef =
    useRef(null);


  const {
    safeFetch,
  } = useNetwork();


  const {
    userId,
    accessToken,
  } = useUser();


  // =========================================================
  // TOKEN
  // =========================================================

  const getAuthToken =
    useCallback(async () => {

      if (accessToken) {
        return accessToken;
      }

      return await SecureStore.getItemAsync(
        "accessToken"
      );

    }, [accessToken]);


  // =========================================================
  // LOAD PROFILE ADDRESS + NEARBY TODOS
  // =========================================================

  const loadMapData =
    useCallback(async () => {

      if (!userId) {
        return;
      }

      try {

        setLoadingTodos(true);
        setError(null);


        const token =
          await getAuthToken();


        if (!token) {

          setError(
            "Bitte melde dich erneut an."
          );

          return;
        }


        // -----------------------------------------------------
        // 1. Profil laden
        // -----------------------------------------------------

        const profileResponse =
          await safeFetch(
            `${API_URL}/api/users/profile/${userId}`,
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


        if (profileResponse?.offline) {

          Toast.show({
            type: "info",
            text1: "Offline",
            text2:
              "Keine Internetverbindung",
          });

          return;
        }


        if (!profileResponse?.ok) {

          console.warn(
            "Profil konnte nicht geladen werden:",
            profileResponse?.status
          );

          setError(
            "Deine Profiladresse konnte nicht geladen werden."
          );

          return;
        }


        const profile =
          await profileResponse.json();


        const latitude =
          profile?.address?.latitude;

        const longitude =
          profile?.address?.longitude;


        if (
          typeof latitude !== "number" ||
          typeof longitude !== "number"
        ) {

          setHomeLocation(null);

          setNearbyTodos([]);

          setError(
            "Hinterlege zuerst eine Adresse in deinem Profil, um Nachbarschafts-Todos auf der Karte zu sehen."
          );

          return;
        }


        const profileLocation = {
          latitude,
          longitude,
        };


        setHomeLocation(
          profileLocation
        );


        // -----------------------------------------------------
        // 2. Todos rund um PROFILADRESSE laden
        // -----------------------------------------------------

        const params =
          new URLSearchParams({
            lat: String(latitude),
            lng: String(longitude),
            radiusMeters: String(
              SEARCH_RADIUS_METERS
            ),
          });


        const todosResponse =
          await safeFetch(
            `${API_URL}/api/todos/nearby?${params.toString()}`,
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


        if (todosResponse?.offline) {

          Toast.show({
            type: "info",
            text1: "Offline",
            text2:
              "Keine Internetverbindung",
          });

          return;
        }


        if (!todosResponse?.ok) {

          console.warn(
            "Fehler beim Laden der nahen Todos:",
            todosResponse?.status
          );

          setError(
            "Todos konnten nicht geladen werden."
          );

          return;
        }


        const data =
          await todosResponse.json();


        setNearbyTodos(
          Array.isArray(data)
            ? data
            : []
        );


      } catch (err) {

        console.error(
          "Fehler beim Laden der Map-Daten:",
          err
        );

        setError(
          "Die Karte konnte nicht geladen werden."
        );


      } finally {

        setLoadingTodos(false);
      }

    }, [
      userId,
      getAuthToken,
      safeFetch,
    ]);


  // =========================================================
  // LOAD WHEN SCREEN GETS FOCUS
  // =========================================================

  useEffect(() => {

    if (isFocused) {
      loadMapData();
    }

  }, [
    isFocused,
    loadMapData,
  ]);


  // =========================================================
  // RECENTER TO PROFILE ADDRESS
  // =========================================================

  const recenterMap = () => {

    if (!homeLocation) {
      return;
    }


    cameraRef.current?.setCamera({

      centerCoordinate: [
        homeLocation.longitude,
        homeLocation.latitude,
      ],

      zoomLevel:
        DEFAULT_ZOOM_LEVEL,

      animationDuration:
        500,

    });
  };


  // =========================================================
  // INITIAL LOADING
  // =========================================================

  if (
    loadingTodos &&
    !homeLocation
  ) {

    return (

      <View style={styles.centered}>

        <ActivityIndicator
          size="large"
          color="#888"
        />

        <Text style={styles.statusText}>
          Deine Nachbarschaft wird geladen...
        </Text>

      </View>
    );
  }


  // =========================================================
  // NO PROFILE ADDRESS / ERROR
  // =========================================================

  if (
    error &&
    !homeLocation
  ) {

    return (

      <View style={styles.centered}>

        <Feather
          name="home"
          size={30}
          color="#4FB6B8"
        />

        <Text style={styles.errorText}>
          {error}
        </Text>

      </View>
    );
  }


  // =========================================================
  // RENDER
  // =========================================================

  return (

    <View style={styles.container}>

      <Mapbox.MapView
        style={styles.map}
      >

        <Mapbox.Camera
          ref={cameraRef}

          centerCoordinate={[
            homeLocation.longitude,
            homeLocation.latitude,
          ]}

          zoomLevel={
            DEFAULT_ZOOM_LEVEL
          }

          animationMode="none"
        />


        {/* ===================================================
            PROFILADRESSE
            =================================================== */}

        <Mapbox.PointAnnotation
          id="home-location"

          coordinate={[
            homeLocation.longitude,
            homeLocation.latitude,
          ]}
        >

          <View
            style={
              styles.homeLocationMarker
            }
          >
            <Feather
              name="home"
              size={14}
              color="#fff"
            />
          </View>

        </Mapbox.PointAnnotation>


        {/* ===================================================
            TODO PINS
            =================================================== */}

        {nearbyTodos.map(
          todo => (

            <Mapbox.PointAnnotation
              key={todo.todoId}

              id={
                `todo-${todo.todoId}`
              }

              coordinate={[
                todo.longitude,
                todo.latitude,
              ]}

              onSelected={() =>
                setSelectedTodo(todo)
              }
            >

              <View style={styles.pin}>

                <Text style={styles.pinText}>
                  📍
                </Text>

              </View>

            </Mapbox.PointAnnotation>

          )
        )}


        {/* ===================================================
            SELECTED TODO PREVIEW
            =================================================== */}

        {selectedTodo && (

          <Mapbox.MarkerView
            coordinate={[
              selectedTodo.longitude,
              selectedTodo.latitude,
            ]}

            anchor={{
              x: 0.5,
              y: 1.35,
            }}
          >

            <TouchableOpacity
              style={
                styles.todoPreview
              }

              activeOpacity={0.85}

              onPress={() =>
                onOpenTodo?.(
                  selectedTodo.todoId
                )
              }
            >

              <Text
                style={
                  styles.todoPreviewTitle
                }
                numberOfLines={2}
              >
                {selectedTodo.title}
              </Text>


              <View
                style={
                  styles.todoPreviewAction
                }
              >

                <Text
                  style={
                    styles.todoPreviewActionText
                  }
                >
                  Todo öffnen
                </Text>

                <Feather
                  name="chevron-right"
                  size={15}
                  color="#4FB6B8"
                />

              </View>

            </TouchableOpacity>

          </Mapbox.MarkerView>

        )}

      </Mapbox.MapView>


      {/* ===================================================
          INFO
          =================================================== */}

      <View style={styles.infoPill}>

        <Feather
          name="home"
          size={14}
          color="#4FB6B8"
        />

        <Text style={styles.infoText}>
          10 km um deine Profiladresse
        </Text>

      </View>


      {/* ===================================================
          RECENTER
          =================================================== */}

      <TouchableOpacity
        style={
          styles.recenterButton
        }

        onPress={
          recenterMap
        }

        activeOpacity={0.8}
      >

        <Feather
          name="home"
          size={21}
          color="#333"
        />

      </TouchableOpacity>


      {/* LOADING */}

      {loadingTodos && (

        <View
          style={
            styles.loadingOverlay
          }
        >

          <ActivityIndicator
            color="#4FB6B8"
          />

        </View>

      )}


      {/* EMPTY */}

      {!loadingTodos &&
        nearbyTodos.length === 0 && (

          <View
            style={
              styles.emptyOverlay
            }
          >

            <Text
              style={
                styles.emptyText
              }
            >
              Keine offenen Todos im Umkreis von 10 km um deine Profiladresse
            </Text>

          </View>

        )}

    </View>
  );
}


// =========================================================
// STYLES
// =========================================================

const styles =
  StyleSheet.create({

    container: {
      flex: 1,
    },

    map: {
      flex: 1,
    },


    centered: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 30,
    },


    statusText: {
      marginTop: 10,
      color: "#888",
    },


    errorText: {
      marginTop: 12,
      color: "#666",
      textAlign: "center",
      lineHeight: 21,
    },


    // HOME

    homeLocationMarker: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: "#4285F4",
      borderWidth: 2,
      borderColor: "#fff",
      alignItems: "center",
      justifyContent: "center",
    },


    // TODO PIN

    pin: {
      backgroundColor: "#4FB6B8",
      borderRadius: 16,
      padding: 6,
    },

    pinText: {
      fontSize: 16,
    },


    // TODO PREVIEW

    todoPreview: {
      minWidth: 150,
      maxWidth: 220,

      backgroundColor: "#fff",

      borderRadius: 10,

      paddingVertical: 9,
      paddingHorizontal: 12,

      shadowColor: "#000",
      shadowOpacity: 0.15,
      shadowRadius: 6,

      elevation: 5,
    },


    todoPreviewTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: "#333",
    },


    todoPreviewAction: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 5,
    },


    todoPreviewActionText: {
      fontSize: 12,
      fontWeight: "600",
      color: "#4FB6B8",
      marginRight: 3,
    },


    // INFO

    infoPill: {
      position: "absolute",
      top: 58,
      left: 12,

      flexDirection: "row",
      alignItems: "center",

      backgroundColor:
        "rgba(255,255,255,0.94)",

      paddingVertical: 7,
      paddingHorizontal: 11,

      borderRadius: 18,

      shadowColor: "#000",
      shadowOpacity: 0.1,
      shadowRadius: 5,

      elevation: 3,
    },


    infoText: {
      marginLeft: 6,
      fontSize: 13,
      fontWeight: "600",
      color: "#444",
    },


    // RECENTER

    recenterButton: {
      position: "absolute",
      right: 14,
      bottom: 90,

      width: 46,
      height: 46,

      borderRadius: 23,

      backgroundColor: "#fff",

      justifyContent: "center",
      alignItems: "center",

      shadowColor: "#000",
      shadowOpacity: 0.15,
      shadowRadius: 6,

      elevation: 4,
    },


    // LOADING

    loadingOverlay: {
      position: "absolute",
      top: 58,
      alignSelf: "center",

      backgroundColor: "#fff",

      borderRadius: 20,
      padding: 8,

      shadowColor: "#000",
      shadowOpacity: 0.08,
      shadowRadius: 4,

      elevation: 3,
    },


    // EMPTY

    emptyOverlay: {
      position: "absolute",
      bottom: 20,

      alignSelf: "center",

      maxWidth: "90%",

      backgroundColor: "#fff",

      borderRadius: 10,

      paddingVertical: 10,
      paddingHorizontal: 14,

      shadowColor: "#000",
      shadowOpacity: 0.1,
      shadowRadius: 5,

      elevation: 3,
    },


    emptyText: {
      color: "#555",
      fontSize: 13,
      textAlign: "center",
    },

  });