import React, {
  useState,
  useRef,
  useCallback,
} from "react";

import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
} from "react-native";

import { useDebounce } from "../hooks/useDebounce";
import {
  suggestAddresses,
  retrieveAddress,
} from "../utils/mapboxSearch";


function generateSessionToken() {

  if (
    typeof crypto !== "undefined" &&
    crypto.randomUUID
  ) {
    return crypto.randomUUID();
  }

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"
    .replace(/[xy]/g, (c) => {

      const r =
        (Math.random() * 16) | 0;

      const v =
        c === "x"
          ? r
          : (r & 0x3) | 0x8;

      return v.toString(16);
    });
}


/**
 * Adress-Eingabefeld mit Live-Vorschlägen
 * aus der Mapbox Search Box API.
 *
 * Es können ausschließlich validierte,
 * von Mapbox erkannte Adressen ausgewählt werden.
 */
export default function AddressAutosuggest({
  onSelect,
  placeholder =
    "Straße Hausnummer, PLZ und Ort eingeben...",
}) {

  const [
    inputValue,
    setInputValue,
  ] = useState("");

  const [
    suggestions,
    setSuggestions,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState(null);


  const sessionTokenRef =
    useRef(
      generateSessionToken()
    );


  const debouncedInput =
    useDebounce(
      inputValue,
      300
    );


  const fetchSuggestions =
    useCallback(
      async (query) => {

        if (
          !query ||
          query.trim().length < 3
        ) {
          setSuggestions([]);
          return;
        }


        setLoading(true);
        setError(null);


        try {

          const results =
            await suggestAddresses(
              query,
              sessionTokenRef.current
            );

          setSuggestions(
            Array.isArray(results)
              ? results
              : []
          );

        } catch (err) {

          console.error(
            "Fehler beim Laden der Adressvorschläge:",
            err
          );

          setError(
            "Vorschläge konnten nicht geladen werden."
          );

          setSuggestions([]);

        } finally {

          setLoading(false);
        }
      },
      []
    );


  React.useEffect(() => {

    fetchSuggestions(
      debouncedInput
    );

  }, [
    debouncedInput,
    fetchSuggestions,
  ]);


  const handleSelectSuggestion =
    async (suggestion) => {

      setLoading(true);
      setError(null);


      try {

        const address =
          await retrieveAddress(
            suggestion.mapbox_id,
            sessionTokenRef.current
          );


        setInputValue(
          `${address.streetNumber}, ${address.postalCode} ${address.city}`
        );


        setSuggestions([]);


        sessionTokenRef.current =
          generateSessionToken();


        await onSelect(
          address
        );


      } catch (err) {

        console.error(
          "Fehler beim Laden oder Speichern der Adresse:",
          err
        );


        setError(
          "Adresse konnte nicht gespeichert werden. Bitte erneut versuchen."
        );

      } finally {

        setLoading(false);
      }
    };


  return (

    <View
      style={
        styles.container
      }
    >

      <TextInput
        style={
          styles.input
        }
        value={
          inputValue
        }
        onChangeText={
          setInputValue
        }
        placeholder={
          placeholder
        }
        autoComplete="off"
        textContentType="none"
        importantForAutofill="no"
      />


      {loading && (

        <ActivityIndicator
          style={
            styles.loadingIndicator
          }
        />

      )}


      {error && (

        <Text
          style={
            styles.errorText
          }
        >
          {error}
        </Text>

      )}


      {suggestions.length > 0 && (

        <View
          style={
            styles.dropdown
          }
        >

          {suggestions.map(
            (item, index) => {

              const context =
                item.context ?? {};


              const streetNumber =
                item.address ||
                item.name ||
                "";


              const postalCode =
                context.postcode
                  ?.name ||
                "";


              const city =
                context.place
                  ?.name ||
                context.locality
                  ?.name ||
                "";


              const countryName =
                context.country
                  ?.name ||
                "";


              const postalCodeAndCity =
                [
                  postalCode,
                  city,
                ]
                  .filter(Boolean)
                  .join(" ");


              return (

                <TouchableOpacity
                  key={
                    item.mapbox_id ??
                    `${streetNumber}-${index}`
                  }
                  style={[
                    styles.suggestionItem,

                    index ===
                      suggestions.length - 1 &&
                      styles.lastSuggestionItem,
                  ]}
                  onPress={() =>
                    handleSelectSuggestion(
                      item
                    )
                  }
                  activeOpacity={0.8}
                >

                  <Text
                    style={
                      styles.suggestionName
                    }
                  >
                    {streetNumber}
                  </Text>


                  {postalCodeAndCity ? (

                    <Text
                      style={
                        styles.suggestionDetail
                      }
                    >
                      {postalCodeAndCity}
                    </Text>

                  ) : null}


                  {countryName ? (

                    <Text
                      style={
                        styles.suggestionCountry
                      }
                    >
                      {countryName}
                    </Text>

                  ) : null}

                </TouchableOpacity>

              );
            }
          )}

        </View>

      )}

    </View>
  );
}


const styles =
  StyleSheet.create({

    container: {
      position: "relative",
      zIndex: 10,
    },

    input: {
      borderWidth: 0.5,
      borderColor: "#ddd",
      borderRadius: 5,
      padding: 10,
      fontSize: 16,
      backgroundColor: "#fff",
    },

    loadingIndicator: {
      marginTop: 8,
    },

    errorText: {
      color: "#d9534f",
      fontSize: 13,
      marginTop: 6,
    },

    dropdown: {
      backgroundColor: "#fff",
      borderRadius: 5,
      borderWidth: 0.5,
      borderColor: "#ddd",
      marginTop: 4,

      shadowColor: "#000",
      shadowOpacity: 0.1,
      shadowRadius: 5,

      elevation: 3,
    },

    suggestionItem: {
      padding: 12,
      borderBottomWidth: 0.5,
      borderBottomColor: "#eee",
    },

    lastSuggestionItem: {
      borderBottomWidth: 0,
    },

    suggestionName: {
      fontSize: 15,
      color: "#333",
    },

    suggestionDetail: {
      fontSize: 13,
      color: "#888",
      marginTop: 2,
    },

    suggestionCountry: {
      fontSize: 13,
      color: "#666",
      marginTop: 2,
    },

  });