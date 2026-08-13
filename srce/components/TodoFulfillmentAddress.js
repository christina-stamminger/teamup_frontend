// srce/components/TodoFulfillmentAddress.js

import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";

import { Feather } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import Toast from "react-native-toast-message";

import { useUser } from "./context/UserContext";
import { useNetwork } from "./context/NetworkContext";
import { API_URL } from "../config/env";


export default function TodoFulfillmentAddress({
  todoId,
  canSee = false,
}) {

  const {
    accessToken,
  } = useUser();

  const {
    safeFetch,
  } = useNetwork();


  const [
    fulfillmentDetails,
    setFulfillmentDetails,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState(null);


  const getAuthToken =
    useCallback(async () => {

      if (accessToken) {
        return accessToken;
      }

      return await SecureStore
        .getItemAsync("accessToken");

    }, [accessToken]);


  const fetchFulfillmentDetails =
    useCallback(async () => {

      if (!canSee || !todoId) {
        return;
      }

      try {

        setLoading(true);
        setError(null);

        const token =
          await getAuthToken();

        if (!token) {

          setError(
            "Nicht angemeldet."
          );

          return;
        }


        const response =
          await safeFetch(
            `${API_URL}/api/todo/${todoId}/fulfillment-details`,
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

          setError(
            "Keine Internetverbindung."
          );

          return;
        }


        if (!response) {

          throw new Error(
            "No response received"
          );
        }


        let result = {};

        try {
          result =
            await response.json();
        } catch {
          result = {};
        }


        if (!response.ok) {

          console.warn(
            "Fulfillment details failed:",
            response.status,
            result
          );

          setError(
            "Adresse konnte nicht geladen werden."
          );

          return;
        }


        setFulfillmentDetails(
          result
        );


      } catch (fetchError) {

        console.error(
          "Fehler beim Laden der Fulfillment-Adresse:",
          fetchError
        );

        setError(
          "Adresse konnte nicht geladen werden."
        );

      } finally {

        setLoading(false);

      }

    }, [
      canSee,
      todoId,
      getAuthToken,
      safeFetch,
    ]);


  useEffect(() => {

    /*
     * Sobald die Berechtigung wegfällt,
     * sensible Daten aus dem lokalen
     * Component-State entfernen.
     */
    if (!canSee) {

      setFulfillmentDetails(null);
      setError(null);
      setLoading(false);

      return;
    }


    /*
     * Bereits geladen -> nicht erneut laden.
     */
    if (
      fulfillmentDetails ||
      loading
    ) {
      return;
    }


    fetchFulfillmentDetails();

  }, [
    canSee,
    fulfillmentDetails,
    loading,
    fetchFulfillmentDetails,
  ]);


  /*
   * Keine Berechtigung:
   * gar nichts rendern.
   */
  if (!canSee) {
    return null;
  }


  return (
    <View style={styles.container}>

      <View style={styles.header}>

        <Feather
          name="map-pin"
          size={18}
          color="#4FB6B8"
          style={styles.icon}
        />

        <Text style={styles.title}>
          Adresse
        </Text>

      </View>


      {loading ? (

        <View style={styles.loadingRow}>

          <ActivityIndicator
            size="small"
            color="#4FB6B8"
          />

          <Text
            style={
              styles.loadingText
            }
          >
            Adresse wird geladen...
          </Text>

        </View>

      ) : error ? (

        <View>

          <Text
            style={
              styles.errorText
            }
          >
            {error}
          </Text>

          <TouchableOpacity
            onPress={
              fetchFulfillmentDetails
            }
            style={
              styles.retryButton
            }
          >

            <Text
              style={
                styles.retryButtonText
              }
            >
              Erneut versuchen
            </Text>

          </TouchableOpacity>

        </View>

      ) : fulfillmentDetails ? (

        <View>

          <Text
            style={
              styles.street
            }
          >
            {
              fulfillmentDetails
                .streetNumber
            }
          </Text>


          <Text
            style={
              styles.city
            }
          >
            {
              fulfillmentDetails
                .postalCode
            }{" "}
            {
              fulfillmentDetails
                .city
            }
          </Text>


          <Text
            style={
              styles.country
            }
          >
            {
              fulfillmentDetails
                .country
            }
          </Text>

        </View>

      ) : null}

    </View>
  );
}


const styles =
  StyleSheet.create({

    container: {
      marginTop: 10,
      marginBottom: 12,
      padding: 12,
      borderRadius: 10,
      backgroundColor:
        "#F3FAFA",
      borderWidth: 1,
      borderColor:
        "#D8EEEE",
    },

    header: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 8,
    },

    icon: {
      marginRight: 7,
    },

    title: {
      fontSize: 15,
      fontWeight: "700",
      color: "#333",
    },

    street: {
      fontSize: 16,
      fontWeight: "600",
      color: "#222",
      marginBottom: 2,
    },

    city: {
      fontSize: 14,
      color: "#444",
    },

    country: {
      fontSize: 12,
      color: "#777",
      marginTop: 2,
    },

    loadingRow: {
      flexDirection: "row",
      alignItems: "center",
    },

    loadingText: {
      marginLeft: 8,
      fontSize: 13,
      color: "#666",
    },

    errorText: {
      fontSize: 13,
      color: "#C92A2A",
    },

    retryButton: {
      marginTop: 8,
      alignSelf:
        "flex-start",
      paddingVertical: 4,
    },

    retryButtonText: {
      color: "#4FB6B8",
      fontSize: 13,
      fontWeight: "600",
    },

  });