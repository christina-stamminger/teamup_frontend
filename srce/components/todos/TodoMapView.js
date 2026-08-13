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
import { useUserLocation } from "../../hooks/useUserLocation";
import { API_URL } from "../../config/env";


const SEARCH_RADIUS_METERS = 10000;
const DEFAULT_ZOOM_LEVEL = 13;


export default function TodoMapView() {

  const [nearbyTodos, setNearbyTodos] =
    useState([]);

  const [loadingTodos, setLoadingTodos] =
    useState(true);

  const isFocused =
    useIsFocused();

  const cameraRef =
    useRef(null);

  const {
    safeFetch,
  } = useNetwork();

  const {
    location,
    loading: loadingLocation,
    error: locationError,
  } = useUserLocation();


  // =========================================================
  // FETCH TODOS
  // =========================================================

  const fetchNearbyTodos =
    useCallback(async () => {

      if (!location) {
        return;
      }

      try {

        setLoadingTodos(true);

        const token =
          await SecureStore.getItemAsync(
            "accessToken"
          );

        if (!token) {

          console.warn(
            "No access token available"
          );

          return;
        }


        const params =
          new URLSearchParams({
            lat: String(
              location.latitude
            ),

            lng: String(
              location.longitude
            ),

            radiusMeters: String(
              SEARCH_RADIUS_METERS
            ),
          });


        const response =
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


        if (response?.offline) {

          Toast.show({
            type: "info",
            text1: "Offline",
            text2:
              "Keine Internetverbindung",
          });

          return;
        }


        if (!response?.ok) {

          console.warn(
            "Fehler beim Laden der nahen Todos:",
            response?.status
          );

          return;
        }


        const data =
          await response.json();


        setNearbyTodos(
          Array.isArray(data)
            ? data
            : []
        );


      } catch (error) {

        console.error(
          "Fehler beim Laden der nahen Todos:",
          error
        );

      } finally {

        setLoadingTodos(false);

      }

    }, [
      location,
      safeFetch,
    ]);


  // =========================================================
  // LOAD WHEN SCREEN / LOCATION CHANGES
  // =========================================================

  useEffect(() => {

    if (
      isFocused &&
      location
    ) {
      fetchNearbyTodos();
    }

  }, [
    isFocused,
    location,
    fetchNearbyTodos,
  ]);


  // =========================================================
  // RECENTER
  // =========================================================

  const recenterMap = () => {

    if (!location) {
      return;
    }

    cameraRef.current?.setCamera({
      centerCoordinate: [
        location.longitude,
        location.latitude,
      ],

      zoomLevel:
        DEFAULT_ZOOM_LEVEL,

      animationDuration:
        500,
    });
  };


  // =========================================================
  // LOCATION STATES
  // =========================================================

  if (loadingLocation) {

    return (
      <View style={styles.centered}>

        <ActivityIndicator
          size="large"
          color="#888"
        />

        <Text style={styles.statusText}>
          Standort wird ermittelt...
        </Text>

      </View>
    );
  }


  if (
    locationError ||
    !location
  ) {

    return (
      <View style={styles.centered}>

        <Text style={styles.errorText}>
          {
            locationError ||
            "Standort nicht verfügbar."
          }
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
            location.longitude,
            location.latitude,
          ]}
          zoomLevel={
            DEFAULT_ZOOM_LEVEL
          }
          animationMode="none"
        />


        {/* Eigener Standort */}

        <Mapbox.PointAnnotation
          id="own-location"
          coordinate={[
            location.longitude,
            location.latitude,
          ]}
        >

          <View
            style={
              styles.ownLocationDot
            }
          />

        </Mapbox.PointAnnotation>


        {/* Todo Pins */}

        {nearbyTodos.map(
          todo => (

            <Mapbox.PointAnnotation
              key={
                todo.todoId
              }
              id={
                `todo-${todo.todoId}`
              }
              coordinate={[
                todo.longitude,
                todo.latitude,
              ]}
            >

              <View
                style={
                  styles.pin
                }
              >

                <Text
                  style={
                    styles.pinText
                  }
                >
                  📍
                </Text>

              </View>


              <Mapbox.Callout
                title={
                  todo.title
                }
              />

            </Mapbox.PointAnnotation>

          )
        )}

      </Mapbox.MapView>


      {/* ===================================================
          INFO
          =================================================== */}

      <View
        style={
          styles.infoPill
        }
      >

        <Feather
          name="map-pin"
          size={14}
          color="#4FB6B8"
        />

        <Text
          style={
            styles.infoText
          }
        >
          Todos bis 10 km
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
          name="crosshair"
          size={22}
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
              Keine offenen Todos im Umkreis von 10 km
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
      padding: 20,
    },


    statusText: {
      marginTop: 10,
      color: "#888",
    },


    errorText: {
      color: "#d9534f",
      textAlign: "center",
    },


    // OWN LOCATION

    ownLocationDot: {
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: "#4285F4",
      borderWidth: 2,
      borderColor: "#fff",
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
    },

  });