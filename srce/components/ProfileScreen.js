import React, { useEffect, useState } from "react";

import {
  View,
  Text,
  TextInput,
  Alert,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Linking
} from "react-native";

import { useNavigation } from "@react-navigation/native";
import Toast from "react-native-toast-message";

import { useUser } from "./context/UserContext";
import { useNetwork } from "../components/context/NetworkContext";
import { API_URL } from "../config/env";
import AddressAutosuggest from "../components/AddressAutosuggest";


const COUNTRY_NAMES = {
  AT: "Österreich",
  DE: "Deutschland",
  CH: "Schweiz",
};


const ProfileScreen = () => {

  const {
    userId,
    accessToken,
    loading: userContextLoading,
    logoutUser,
  } = useUser();

  const {
    safeFetch,
  } = useNetwork();

  const navigation =
    useNavigation();


  // =========================================================
  // PROFILE STATE
  // =========================================================

  const [userDetails, setUserDetails] =
    useState({
      username: "",
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      email: "",
      password: "********",
    });


  // =========================================================
  // ADDRESS STATE
  // =========================================================

  const [address, setAddress] =
    useState(null);

  const [showAddressInput, setShowAddressInput] =
    useState(false);

  const [addressSaving, setAddressSaving] =
    useState(false);

  /*
   * Kommt vom Backend:
   *
   * true:
   * Adresse darf geändert werden.
   *
   * false:
   * Mindestens eines der eigenen Todos
   * befindet sich gerade IN_ARBEIT.
   */
  const [addressEditable, setAddressEditable] =
    useState(true);


  // =========================================================
  // GENERAL STATE
  // =========================================================

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);


  // =========================================================
  // HELPERS
  // =========================================================

  const getCountryName = (
    countryCode
  ) =>
    COUNTRY_NAMES[
    countryCode?.toUpperCase()
    ] ||
    countryCode ||
    "";


  // =========================================================
  // LOAD PROFILE
  // =========================================================

  useEffect(() => {

    if (userContextLoading) {
      return;
    }


    if (
      !accessToken ||
      !userId
    ) {

      Alert.alert(
        "Fehler",
        "Sitzungsdaten fehlen. Bitte erneut einloggen."
      );

      return;
    }


    fetchUserProfile();

  }, [
    userContextLoading,
    userId,
    accessToken,
  ]);


  const fetchUserProfile =
    async () => {

      try {

        setLoading(true);


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

          Alert.alert(
            "Fehler",
            "Profil konnte nicht geladen werden."
          );

          return;
        }


        const data =
          await response.json();


        // =====================================================
        // PROFILE
        // =====================================================

        setUserDetails({
          username:
            data.username || "",

          firstName:
            data.firstName || "",

          lastName:
            data.lastName || "",

          dateOfBirth:
            data.dateOfBirth || "",

          email:
            data.email || "",

          password:
            "********",
        });


        // =====================================================
        // ADDRESS EDITABILITY
        // =====================================================

        setAddressEditable(
          data.addressEditable !== false
        );


        // =====================================================
        // ADDRESS
        // =====================================================

        if (data.address) {

          setAddress({
            streetNumber:
              data.address.streetNumber,

            postalCode:
              data.address.postalCode,

            city:
              data.address.city,

            country:
              data.address.country,
          });

        } else {

          setAddress(null);
        }


      } catch (error) {

        console.error(
          "Fehler beim Abrufen des Profils:",
          error
        );


        Alert.alert(
          "Fehler",
          "Beim Laden deines Profils ist ein Problem aufgetreten."
        );

      } finally {

        setLoading(false);
      }
    };


  // =========================================================
  // SAVE PROFILE
  // =========================================================

  const handleSave =
    async () => {

      setSaving(true);


      try {

        const response =
          await safeFetch(
            `${API_URL}/api/user`,
            {
              method: "PUT",

              headers: {
                Authorization:
                  `Bearer ${accessToken}`,

                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  userId,
                  firstName:
                    userDetails.firstName,
                  lastName:
                    userDetails.lastName,
                  dateOfBirth:
                    userDetails.dateOfBirth,
                }),
            }
          );


        if (response?.offline) {

          Alert.alert(
            "Offline",
            "Keine Internetverbindung."
          );

          return;
        }


        if (response.ok) {

          Alert.alert(
            "Erfolg",
            "Profil erfolgreich gespeichert."
          );

          return;
        }


        const errData =
          await response.json();


        const msg =
          errData.errors?.join("\n") ||
          errData.errorMessage ||
          errData.message ||
          "Profil konnte nicht gespeichert werden.";


        Alert.alert(
          "Fehler",
          msg
        );


      } catch (error) {

        console.error(
          "Fehler beim Speichern des Profils:",
          error
        );


        Alert.alert(
          "Fehler",
          "Beim Speichern deines Profils ist ein Problem aufgetreten."
        );

      } finally {

        setSaving(false);
      }
    };


  // =========================================================
  // ADDRESS
  // =========================================================

  const handleAddressSelected =
    async (
      selectedAddress
    ) => {

      /*
       * Frontend-Schutz.
       *
       * Backend prüft zusätzlich ebenfalls,
       * damit die Regel nicht umgangen werden kann.
       */
      if (!addressEditable) {

        setShowAddressInput(false);


        Alert.alert(
          "Adresse kann nicht geändert werden",
          "Deine Adresse ist vorübergehend gesperrt, solange eines deiner Todos in Arbeit ist."
        );

        return;
      }


      setAddressSaving(true);


      try {

        const response =
          await safeFetch(
            `${API_URL}/api/address`,
            {
              method: "PUT",

              headers: {
                Authorization:
                  `Bearer ${accessToken}`,

                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify(
                  selectedAddress
                ),
            }
          );


        if (response?.offline) {

          Alert.alert(
            "Offline",
            "Keine Internetverbindung."
          );

          return;
        }


        if (response.ok) {

          const data =
            await response.json();


          setAddress({
            streetNumber:
              data.address.streetNumber,

            postalCode:
              data.address.postalCode,

            city:
              data.address.city,

            country:
              data.address.country,
          });


          setShowAddressInput(false);


          Alert.alert(
            "Erfolg",
            "Adresse erfolgreich gespeichert."
          );

          return;
        }


        /*
         * Kann z.B. passieren, wenn zwischen
         * Profil-Laden und Adressänderung
         * ein eigenes Todo übernommen wurde.
         */
        if (
          response.status === 409
        ) {

          setShowAddressInput(false);

          setAddressEditable(false);


          Alert.alert(
            "Adresse kann nicht geändert werden",
            "Deine Adresse ist vorübergehend gesperrt, solange eines deiner Todos in Arbeit ist."
          );


          /*
           * Aktuellen Backend-Stand nochmals laden.
           */
          await fetchUserProfile();

          return;
        }


        const errData =
          await response.json();


        const msg =
          errData.errors?.join("\n") ||
          errData.errorMessage ||
          errData.message ||
          "Adresse konnte nicht gespeichert werden.";


        Alert.alert(
          "Fehler",
          msg
        );


      } catch (error) {

        console.error(
          "Fehler beim Speichern der Adresse:",
          error
        );


        Alert.alert(
          "Fehler",
          "Beim Speichern deiner Adresse ist ein Problem aufgetreten."
        );

      } finally {

        setAddressSaving(false);
      }
    };


  // =========================================================
  // ACCOUNT DELETE CHECK
  // =========================================================

  const handleCheckAccountDeletion =
    async () => {

      try {

        const response =
          await safeFetch(
            `${API_URL}/api/user/${userId}/canDelete`,
            {
              headers: {
                Authorization:
                  `Bearer ${accessToken}`,
              },
            }
          );


        if (response?.offline) {

          Alert.alert(
            "Offline",
            "Keine Internetverbindung."
          );

          return;
        }


        if (!response.ok) {

          throw new Error(
            "Fehler beim Prüfen des Accountstatus"
          );
        }


        const data =
          await response.json();


        if (!data.canDelete) {

          Alert.alert(
            "Account kann nicht gelöscht werden",

            data.reason ||
            "Du bist noch Admin einer Gruppe oder hast aktive Todos."
          );

          return;
        }


        Alert.alert(
          "Account wirklich löschen?",

          "Deine Account-Daten und eigenen Todos werden gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.",

          [
            {
              text: "Abbrechen",
              style: "cancel",
            },

            {
              text: "Löschen",
              style: "destructive",
              onPress:
                handleDeleteAccount,
            },
          ]
        );


      } catch (error) {

        console.error(
          "Fehler beim Prüfen der Accountlöschung:",
          error
        );


        Alert.alert(
          "Fehler",
          "Konnte Accountstatus nicht prüfen."
        );
      }
    };


  // =========================================================
  // DELETE ACCOUNT
  // =========================================================

  const handleDeleteAccount =
    async () => {

      try {

        const response =
          await safeFetch(
            `${API_URL}/api/user/${userId}`,
            {
              method: "DELETE",

              headers: {
                Authorization:
                  `Bearer ${accessToken}`,
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

          const errorData =
            await response
              .json()
              .catch(
                () => ({})
              );


          throw new Error(
            errorData.error ||
            "Fehler beim Löschen des Accounts"
          );
        }


        /*
         * User wurde serverseitig gelöscht.
         * Danach lokale Session vollständig entfernen.
         */
        await logoutUser();


      } catch (error) {

        console.error(
          "Fehler beim Löschen des Accounts:",
          error
        );


        Alert.alert(
          "Fehler",
          error.message ||
          "Account konnte nicht gelöscht werden."
        );
      }
    };


  // =========================================================
  // LOADING
  // =========================================================

  if (
    loading ||
    userContextLoading
  ) {

    return (

      <View
        style={
          styles.loadingContainer
        }
      >

        <ActivityIndicator
          size="large"
          color="#4FB6B8"
        />

        <Text
          style={
            styles.loadingText
          }
        >
          Profil wird geladen...
        </Text>

      </View>
    );
  }


  // =========================================================
  // RENDER
  // =========================================================

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollViewContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>

          {/* =================================================
              BACK
              ================================================= */}

          <TouchableOpacity
            style={styles.topBackButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Text style={styles.topBackButtonText}>
              ‹ Zurück
            </Text>
          </TouchableOpacity>


          <Text style={styles.header}>
            Benutzerprofil
          </Text>


          {/* =================================================
              PROFILE + ADDRESS
              ================================================= */}

          <View style={styles.infoContainer}>

            <LabelValue
              label="Benutzername"
              value={userDetails.username}
            />

            <LabelValue
              label="E-Mail"
              value={userDetails.email}
            />

            <LabelValue
              label="Passwort"
              value={userDetails.password}
            />


            {/* VORNAME */}

            <Text style={styles.label}>
              Vorname:
            </Text>

            <TextInput
              style={styles.input}
              value={userDetails.firstName}
              onChangeText={(val) =>
                setUserDetails((prev) => ({
                  ...prev,
                  firstName: val,
                }))
              }
              editable={!saving}
              autoComplete="off"
              textContentType="none"
              importantForAutofill="no"
            />


            {/* NACHNAME */}

            <Text style={styles.label}>
              Nachname:
            </Text>

            <TextInput
              style={styles.input}
              value={userDetails.lastName}
              onChangeText={(val) =>
                setUserDetails((prev) => ({
                  ...prev,
                  lastName: val,
                }))
              }
              editable={!saving}
              autoComplete="off"
              textContentType="none"
              importantForAutofill="no"
            />


            {/* GEBURTSDATUM */}

            <Text style={styles.label}>
              Geburtsdatum (YYYY-MM-DD):
            </Text>

            <TextInput
              style={styles.input}
              value={userDetails.dateOfBirth}
              onChangeText={(val) =>
                setUserDetails((prev) => ({
                  ...prev,
                  dateOfBirth: val,
                }))
              }
              editable={!saving}
              placeholder="1990-01-31"
              autoComplete="off"
              textContentType="none"
              importantForAutofill="no"
            />


            {/* =================================================
                ADDRESS
                ================================================= */}

            <View style={styles.profileDivider} />

            <Text style={styles.profileSectionTitle}>
              Adresse
            </Text>


            {/* ADDRESS EXISTS */}

            {address && !showAddressInput && (
              <>
                <View style={styles.addressDisplay}>
                  <Text style={styles.value}>
                    {address.streetNumber}
                    {"\n"}
                    {address.postalCode} {address.city}
                    {"\n"}
                    {getCountryName(address.country)}
                  </Text>
                </View>


                {addressEditable ? (
                  <TouchableOpacity
                    style={styles.infoButton}
                    onPress={() => setShowAddressInput(true)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.infoButtonText}>
                      Adresse ändern
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.addressLockedBox}>
                    <Text style={styles.addressLockedTitle}>
                      🔒 Adresse vorübergehend gesperrt
                    </Text>

                    <Text style={styles.addressLockedText}>
                      Deine Adresse kann nicht geändert werden,
                      solange eines deiner Todos in Arbeit ist.
                    </Text>
                  </View>
                )}
              </>
            )}


            {/* NO ADDRESS */}

            {!address && !showAddressInput && (
              <>
                <Text style={styles.addressHint}>
                  Noch keine Adresse hinterlegt. Eine Adresse wird
                  benötigt, wenn du ein öffentliches Todo erstellen
                  möchtest.
                </Text>

                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => setShowAddressInput(true)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.secondaryButtonText}>
                    Adresse hinzufügen
                  </Text>
                </TouchableOpacity>
              </>
            )}


            {/* ADDRESS INPUT */}

            {showAddressInput && (
              <>
                <AddressAutosuggest
                  onSelect={handleAddressSelected}
                />

                {addressSaving && (
                  <ActivityIndicator
                    style={{ marginTop: 10 }}
                    color="#4FB6B8"
                  />
                )}

                <TouchableOpacity
                  style={styles.cancelLink}
                  onPress={() => setShowAddressInput(false)}
                  disabled={addressSaving}
                >
                  <Text style={styles.cancelLinkText}>
                    Abbrechen
                  </Text>
                </TouchableOpacity>
              </>
            )}


            {/* =================================================
                SAVE PROFILE
                ================================================= */}

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  saving && styles.disabledButton,
                ]}
                onPress={handleSave}
                disabled={saving}
                activeOpacity={0.8}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>
                    Profil speichern
                  </Text>
                )}
              </TouchableOpacity>
            </View>

          </View>


          {/* =================================================
              INFO & SECURITY
              ================================================= */}

          <View style={styles.infoSection}>

            <Text style={styles.sectionTitle}>
              Info & Sicherheit
            </Text>

            <Text style={styles.infoDescription}>
              Erfahre, wie bringit funktioniert,
              wann deine Adresse sichtbar wird
              und wie Vereinbarungen und
              Bezahlungen gehandhabt werden.
            </Text>


            <TouchableOpacity
              style={styles.infoButton}
              onPress={() =>
                navigation.navigate("Onboarding")
              }
            >
              <Text style={styles.infoButtonText}>
                So funktioniert bringit
              </Text>
            </TouchableOpacity>


            <TouchableOpacity
              style={[
                styles.infoButton,
                styles.infoButtonSpacing,
              ]}
              onPress={() =>
                navigation.navigate("Privacy")
              }
            >
              <Text style={styles.infoButtonText}>
                Datenschutz & Standort
              </Text>
            </TouchableOpacity>


            <TouchableOpacity
              style={styles.privacyLinkButton}
              activeOpacity={0.85}
              onPress={() =>
                Linking.openURL(
                  "https://christina-stamminger.github.io/bringit-privacy/"
                )
              }
            >
              <Text style={styles.privacyLinkButtonText}>
                Vollständige Datenschutzerklärung
              </Text>
            </TouchableOpacity>

          </View>


          {/* =================================================
              DANGER ZONE
              ================================================= */}

          <View style={styles.dangerZone}>

            <Text style={styles.dangerTitle}>
              Account löschen
            </Text>

            <Text style={styles.dangerDescription}>
              Du kannst deinen Account nur löschen,
              wenn du keine Adminrolle in Gruppen mehr
              hast und keine aktiven Todos in Arbeit sind.
              Eigene Todos und zugehörige Daten werden
              bei der Account-Löschung entfernt.
            </Text>

            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleCheckAccountDeletion}
            >
              <Text style={styles.deleteButtonText}>
                Account löschen
              </Text>
            </TouchableOpacity>

          </View>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};


// =========================================================
// LABEL VALUE
// =========================================================


// =========================================================
// LABEL VALUE
// =========================================================

const LabelValue = ({
  label,
  value,
}) => (
  <>

    <Text
      style={
        styles.label
      }
    >
      {label}:
    </Text>

    <Text
      style={
        styles.value
      }
    >
      {value || "-"}
    </Text>

  </>
);


// =========================================================
// STYLES
// =========================================================

const styles =
  StyleSheet.create({

    container: {
      flex: 1,
      backgroundColor:
        "#f9f9f9",
    },


    scrollViewContainer: {
      padding: 20,
      paddingBottom: 40,
    },


    loadingContainer: {
      flex: 1,
      justifyContent:
        "center",
      alignItems:
        "center",
    },


    loadingText: {
      marginTop: 10,
    },


    header: {
      fontSize: 26,
      color: "#333",
      marginTop: 20,
      marginBottom: 10,
      textAlign: "center",
    },


    // PROFILE

    infoContainer: {
      backgroundColor: "#fff",
      borderRadius: 10,
      padding: 15,
      marginBottom: 10,

      shadowColor: "#000",
      shadowOpacity: 0.1,
      shadowRadius: 5,

      elevation: 3,
    },


    label: {
      fontSize: 14,
      fontWeight: "600",
      color: "#555",
      marginTop: 10,
    },


    value: {
      fontSize: 16,
      color: "#333",
      marginBottom: 10,
      padding: 10,
      backgroundColor: "#f0f0f0",
      borderRadius: 5,
    },


    input: {
      borderWidth: 0.5,
      borderColor: "#ddd",
      borderRadius: 5,
      padding: 10,
      fontSize: 16,
      backgroundColor: "#fff",
      marginBottom: 10,
    },


    // PROFILE BUTTONS

    buttonContainer: {
      marginTop: 20,
    },


    saveButton: {
      backgroundColor: "#4FB6B8",
      padding: 15,
      borderRadius: 10,
      alignItems: "center",
      marginBottom: 10,
    },


    disabledButton: {
      backgroundColor: "#aaa",
    },


    saveButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "bold",
    },


    backButton: {
      backgroundColor: "#ccc",
      padding: 15,
      borderRadius: 8,
      alignItems: "center",
    },


    backButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "bold",
    },


    // ADDRESS

    addressSection: {
      backgroundColor: "#fff",
      borderRadius: 10,
      padding: 15,
      marginTop: 20,

      shadowColor: "#000",
      shadowOpacity: 0.1,
      shadowRadius: 5,

      elevation: 3,
    },


    sectionTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: "#333",
      marginBottom: 10,
    },


    addressDisplay: {
      marginBottom: 10,
    },


    addressHint: {
      fontSize: 14,
      lineHeight: 20,
      color: "#888",
      marginBottom: 12,
    },


    secondaryButton: {
      backgroundColor: "#4FB6B8",
      padding: 12,
      borderRadius: 8,
      alignItems: "center",
    },


    secondaryButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "bold",
    },


    addressLockedBox: {
      backgroundColor: "#F5F5F5",
      borderRadius: 8,
      padding: 12,
      borderWidth: 1,
      borderColor: "#E2E2E2",
    },


    addressLockedTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: "#444",
      marginBottom: 5,
    },


    addressLockedText: {
      fontSize: 13,
      lineHeight: 19,
      color: "#666",
    },


    cancelLink: {
      marginTop: 12,
      alignItems: "center",
    },


    cancelLinkText: {
      color: "#888",
      fontSize: 14,
    },


    // INFO & SECURITY

    infoSection: {
      backgroundColor: "#fff",
      borderRadius: 10,
      padding: 15,
      marginTop: 20,

      shadowColor: "#000",
      shadowOpacity: 0.1,
      shadowRadius: 5,

      elevation: 3,
    },


    infoDescription: {
      fontSize: 14,
      lineHeight: 20,
      color: "#666",
      marginBottom: 14,
    },


    infoButton: {
      borderWidth: 1,
      borderColor: "#4FB6B8",
      borderRadius: 8,
      padding: 12,
      alignItems: "center",
    },


    infoButtonText: {
      color: "#4FB6B8",
      fontSize: 15,
      fontWeight: "700",
    },


    infoButtonSpacing: {
      marginTop: 10,
    },


    // DANGER ZONE

    dangerZone: {
      marginTop: 40,
      padding: 15,
      backgroundColor: "#ffe6e6",
      borderRadius: 8,
      borderWidth: 1,
      borderColor: "#ffcccc",
    },


    dangerTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: "#d9534f",
      marginBottom: 10,
    },


    dangerDescription: {
      fontSize: 14,
      lineHeight: 20,
      color: "#666",
      marginBottom: 15,
    },


    deleteButton: {
      backgroundColor: "#d9534f",
      padding: 12,
      borderRadius: 8,
      alignItems: "center",
    },


    deleteButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "bold",
    },
    privacyLinkButton: {
      marginTop: 18,
      backgroundColor: "#4FB6B8",
      borderRadius: 10,
      paddingVertical: 14,
      paddingHorizontal: 16,
      alignItems: "center",
    },

    privacyLinkButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "700",
    },
    topBackButton: {
      alignSelf: "flex-start",
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 18,
      backgroundColor: "#E9F7F7",
      marginTop: 8,
    },

    topBackButtonText: {
      color: "#4FB6B8",
      fontSize: 16,
      fontWeight: "700",
    },
  });


export default ProfileScreen;