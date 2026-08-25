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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useUser } from "./context/UserContext";
import { useNetwork } from "../components/context/NetworkContext";
import { API_URL } from "../config/env";
import AddressAutosuggest from "../components/AddressAutosuggest";


const COUNTRY_NAMES = {
  AT: "Österreich",
  DE: "Deutschland",
  CH: "Schweiz",
};


const ProfileScreen = ({ route }) => {
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

  const insets =
    useSafeAreaInsets();

  const isInitialAddressSetup =
    route?.params?.openAddressSetup === true;

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

  useEffect(() => {
    if (isInitialAddressSetup) {
      setShowAddressInput(true);
    }
  }, [isInitialAddressSetup]);

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


          /*
           * First-Run:
           * Adresse ist gespeichert,
           * jetzt in die eigentliche App.
           */
          if (isInitialAddressSetup) {

            Toast.show({
              type: "success",
              text1: "Adresse gespeichert",
              text2: "Jetzt kann's losgehen!",
            });


            navigation.reset({
              index: 0,
              routes: [
                {
                  name: "HomeTabs",
                },
              ],
            });


            return;
          }


          /*
           * Normale Adressänderung im Profil.
           */
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

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollViewContainer,
          {
            paddingTop: Math.max(
              insets.top + 10,
              24
            ),
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

        {/* HEADER */}
        <View style={styles.headerArea}>

          <TouchableOpacity
            style={styles.topBackButton}
            onPress={() => {
              if (isInitialAddressSetup) {
                navigation.reset({
                  index: 0,
                  routes: [
                    {
                      name: "HomeTabs",
                    },
                  ],
                });

                return;
              }

              if (navigation.canGoBack()) {
                navigation.goBack();
              }
            }}
            disabled={saving}
            activeOpacity={0.7}
          >
            <Text style={styles.topBackButtonText}>
              ‹ Zurück
            </Text>
          </TouchableOpacity>


          <Text style={styles.header}>
            Profil
          </Text>

          <Text style={styles.headerSubtitle}>
            Deine persönlichen Daten und Einstellungen
          </Text>

        </View>


        {/* =================================================
            ACCOUNT
            ================================================= */}

        <Text style={styles.sectionLabel}>
          ACCOUNT
        </Text>

        <View style={styles.settingsCard}>

          <LabelValue
            label="Benutzername"
            value={userDetails.username}
          />

          <View style={styles.rowDivider} />

          <LabelValue
            label="E-Mail"
            value={userDetails.email}
          />

          <View style={styles.rowDivider} />

          <LabelValue
            label="Passwort"
            value={userDetails.password}
          />

        </View>


        {/* =================================================
            PERSONAL DATA
            ================================================= */}

        <Text style={styles.sectionLabel}>
          PERSÖNLICHE DATEN
        </Text>

        <View style={styles.settingsCard}>

          {/* VORNAME */}

          <Text style={styles.inputLabel}>
            Vorname
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

          <Text style={styles.inputLabel}>
            Nachname
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


          {/* GEBURTSDATUM - LOGIK UND FORMAT UNVERÄNDERT */}

          <Text style={styles.inputLabel}>
            Geburtsdatum (YYYY-MM-DD)
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


          <TouchableOpacity
            style={[
              styles.saveButton,
              saving && styles.disabledButton,
            ]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>
                Änderungen speichern
              </Text>
            )}
          </TouchableOpacity>

        </View>


        {/* =================================================
            ADDRESS
            ================================================= */}

        <Text style={styles.sectionLabel}>
          STANDORT
        </Text>

        <View style={styles.settingsCard}>

          <View style={styles.sectionHeadingRow}>
            <View style={styles.locationIcon}>
              <Text style={styles.locationIconText}>
                📍
              </Text>
            </View>

            <View style={styles.sectionHeadingContent}>
              <Text style={styles.cardTitle}>
                Profiladresse
              </Text>

              <Text style={styles.cardSubtitle}>
                Bestimmt, welche Todos dir in deiner Umgebung angezeigt werden.
              </Text>
            </View>
          </View>


          {isInitialAddressSetup && !address && (
            <View style={styles.addressSetupInfo}>
              <Text style={styles.addressSetupTitle}>
                Gleich kann's losgehen
              </Text>

              <Text style={styles.addressSetupText}>
                Hinterlege deine Profiladresse, damit wir dir
                offene Todos im Umkreis von 10 km zeigen können.
                Deine genaue Adresse bleibt dabei geschützt.
              </Text>
            </View>
          )}


          {/* ADDRESS EXISTS */}

          {address && !showAddressInput && (
            <>
              <View style={styles.addressDisplay}>
                <Text style={styles.addressMain}>
                  {address.streetNumber}
                </Text>

                <Text style={styles.addressSecondary}>
                  {address.postalCode} {address.city}
                </Text>

                <Text style={styles.addressSecondary}>
                  {getCountryName(address.country)}
                </Text>
              </View>


              {addressEditable ? (
                <TouchableOpacity
                  style={styles.secondaryOutlineButton}
                  onPress={() =>
                    setShowAddressInput(true)
                  }
                  activeOpacity={0.8}
                >
                  <Text style={styles.secondaryOutlineButtonText}>
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
                style={styles.primaryCompactButton}
                onPress={() =>
                  setShowAddressInput(true)
                }
                activeOpacity={0.85}
              >
                <Text style={styles.primaryCompactButtonText}>
                  Adresse hinzufügen
                </Text>
              </TouchableOpacity>
            </>
          )}


          {/* ADDRESS INPUT */}

          {showAddressInput && (
            <>
              <View style={styles.addressInputArea}>
                <AddressAutosuggest
                  onSelect={handleAddressSelected}
                />
              </View>

              {addressSaving && (
                <ActivityIndicator
                  style={{ marginTop: 12 }}
                  color="#4FB6B8"
                />
              )}

              {!isInitialAddressSetup && (
                <TouchableOpacity
                  style={styles.cancelLink}
                  onPress={() =>
                    setShowAddressInput(false)
                  }
                  disabled={addressSaving}
                >
                  <Text style={styles.cancelLinkText}>
                    Abbrechen
                  </Text>
                </TouchableOpacity>
              )}
            </>
          )}

        </View>


        {/* =================================================
            INFO & SECURITY
            ================================================= */}

        <Text style={styles.sectionLabel}>
          INFO & SICHERHEIT
        </Text>

        <View
          style={styles.settingsCard}
        >
          <TouchableOpacity
            style={styles.settingsRow}
            onPress={() =>
              navigation.navigate(
                "Onboarding",
                {
                  previewMode: true,
                }
              )}
            activeOpacity={0.7}
          >
            <View style={styles.settingsRowContent}>
              <Text style={styles.settingsRowTitle}>
                So funktioniert bringit
              </Text>

              <Text style={styles.settingsRowSubtitle}>
                Ablauf und Nutzung der App
              </Text>
            </View>

            <Text style={styles.chevron}>
              ›
            </Text>
          </TouchableOpacity>


          <View style={styles.rowDivider} />


          <TouchableOpacity
            style={styles.settingsRow}
            onPress={() =>
              navigation.navigate("Privacy")
            }
            activeOpacity={0.7}
          >
            <View style={styles.settingsRowContent}>
              <Text style={styles.settingsRowTitle}>
                Datenschutz & Standort
              </Text>

              <Text style={styles.settingsRowSubtitle}>
                Wann und wie Standortdaten verwendet werden
              </Text>
            </View>

            <Text style={styles.chevron}>
              ›
            </Text>
          </TouchableOpacity>


          <View style={styles.rowDivider} />


          <TouchableOpacity
            style={styles.settingsRow}
            activeOpacity={0.7}
            onPress={() =>
              Linking.openURL(
                "https://christina-stamminger.github.io/bringit-privacy/"
              )
            }
          >
            <View style={styles.settingsRowContent}>
              <Text style={styles.settingsRowTitle}>
                Vollständige Datenschutzerklärung
              </Text>

              <Text style={styles.settingsRowSubtitle}>
                Im Browser öffnen
              </Text>
            </View>

            <Text style={styles.externalIcon}>
              ↗
            </Text>
          </TouchableOpacity>

        </View>


        {/* =================================================
            DANGER ZONE
            ================================================= */}

        <Text style={styles.sectionLabel}>
          ACCOUNTVERWALTUNG
        </Text>

        <View
          style={[
            styles.settingsCard,
            styles.dangerCard,
          ]}
        >
          <Text style={styles.deleteTitle}>
            Account löschen
          </Text>

          <Text style={styles.deleteDescription}>
            Dein Account kann nur gelöscht werden,
            wenn keine aktiven Todos in Arbeit sind
            und keine erforderlichen Adminrollen bestehen.
          </Text>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleCheckAccountDeletion}
            activeOpacity={0.8}
          >
            <Text style={styles.deleteButtonText}>
              Account löschen
            </Text>
          </TouchableOpacity>

        </View>


        <View style={styles.bottomSpacer} />

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
    <Text style={styles.readOnlyLabel}>
      {label}
    </Text>

    <Text style={styles.readOnlyValue}>
      {value || "-"}
    </Text>
  </>
);


// =========================================================
// STYLES
// =========================================================

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#F7F8FA",
  },


  scrollViewContainer: {
    paddingHorizontal: 18,
    paddingBottom: 40,
  },


  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F7F8FA",
  },


  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: "#747A80",
  },


  // =========================================================
  // HEADER
  // =========================================================

  headerArea: {
    marginBottom: 26,
  },


  topBackButton: {
    alignSelf: "flex-start",
    minHeight: 36,
    justifyContent: "center",
    paddingRight: 12,
    marginBottom: 14,
  },


  topBackButtonText: {
    color: "#3FA9AB",
    fontSize: 16,
    fontWeight: "700",
  },


  header: {
    fontSize: 30,
    fontWeight: "800",
    color: "#12151A",
    letterSpacing: -0.7,
  },


  headerSubtitle: {
    marginTop: 5,
    fontSize: 14,
    lineHeight: 20,
    color: "#7A8086",
  },


  // =========================================================
  // SECTIONS / CARDS
  // =========================================================

  sectionLabel: {
    marginLeft: 4,
    marginBottom: 8,
    marginTop: 8,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: "#8B9299",
  },


  settingsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 22,

    borderWidth: 1,
    borderColor: "#EFF1F3",

    shadowColor: "#12151A",
    shadowOpacity: 0.035,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 4,
    },

    elevation: 1,
  },


  rowDivider: {
    height: 1,
    backgroundColor: "#F0F1F3",
    marginVertical: 14,
  },


  // =========================================================
  // READ ONLY ACCOUNT DATA
  // =========================================================

  readOnlyLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#8B9299",
    marginBottom: 4,
  },


  readOnlyValue: {
    fontSize: 16,
    fontWeight: "500",
    color: "#24282D",
  },


  // =========================================================
  // EDITABLE PROFILE DATA
  // =========================================================

  inputLabel: {
    fontSize: 13,
    fontWeight: "650",
    color: "#4C5258",
    marginBottom: 7,
    marginTop: 4,
  },


  input: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: "#E3E6E8",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 16,
    color: "#12151A",
    backgroundColor: "#FAFBFC",
    marginBottom: 16,
  },


  saveButton: {
    minHeight: 50,
    backgroundColor: "#4FB6B8",
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 5,
  },


  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },


  disabledButton: {
    opacity: 0.55,
  },


  // =========================================================
  // ADDRESS
  // =========================================================

  sectionHeadingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },


  locationIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#EAF7F7",
    marginRight: 12,
  },


  locationIconText: {
    fontSize: 20,
  },


  sectionHeadingContent: {
    flex: 1,
  },


  cardTitle: {
    fontSize: 17,
    fontWeight: "750",
    color: "#171A1F",
  },


  cardSubtitle: {
    marginTop: 3,
    fontSize: 13,
    lineHeight: 18,
    color: "#7A8086",
  },


  addressDisplay: {
    backgroundColor: "#F7F8FA",
    borderRadius: 13,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: 12,
  },


  addressMain: {
    fontSize: 15,
    fontWeight: "650",
    color: "#24282D",
    marginBottom: 3,
  },


  addressSecondary: {
    fontSize: 14,
    lineHeight: 20,
    color: "#626970",
  },


  addressHint: {
    fontSize: 14,
    lineHeight: 20,
    color: "#6F767D",
    marginBottom: 16,
  },


  primaryCompactButton: {
    minHeight: 46,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#4FB6B8",
  },


  primaryCompactButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },


  secondaryOutlineButton: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#B9DFE0",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },


  secondaryOutlineButtonText: {
    color: "#329A9C",
    fontSize: 14,
    fontWeight: "700",
  },


  addressInputArea: {
    marginTop: 2,
  },


  addressLockedBox: {
    backgroundColor: "#F6F7F8",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E8EAEC",
  },


  addressLockedTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#444A50",
    marginBottom: 5,
  },


  addressLockedText: {
    fontSize: 13,
    lineHeight: 19,
    color: "#696F75",
  },


  addressSetupInfo: {
    marginBottom: 18,
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#EAF7F7",
  },


  addressSetupTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2B8A8C",
    marginBottom: 5,
  },


  addressSetupText: {
    fontSize: 13,
    lineHeight: 19,
    color: "#52666A",
  },


  cancelLink: {
    marginTop: 12,
    alignItems: "center",
  },


  cancelLinkText: {
    color: "#7A8086",
    fontSize: 14,
    fontWeight: "600",
  },


  // =========================================================
  // SETTINGS ROWS
  // =========================================================

  settingsRow: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
  },


  settingsRowContent: {
    flex: 1,
    paddingRight: 12,
  },


  settingsRowTitle: {
    fontSize: 15,
    fontWeight: "650",
    color: "#24282D",
  },


  settingsRowSubtitle: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 17,
    color: "#8A9096",
  },


  chevron: {
    fontSize: 27,
    fontWeight: "300",
    color: "#B1B6BB",
    marginTop: -2,
  },


  externalIcon: {
    fontSize: 18,
    color: "#8A9096",
  },


  // =========================================================
  // DELETE ACCOUNT
  // =========================================================

  deleteTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#24282D",
    marginBottom: 6,
  },


  deleteDescription: {
    fontSize: 13,
    lineHeight: 19,
    color: "#747A80",
    marginBottom: 15,
  },


  deleteButton: {
    minHeight: 46,
    borderRadius: 12,
    backgroundColor: "#D9534F",
    alignItems: "center",
    justifyContent: "center",
  },

  deleteButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },


  bottomSpacer: {
    height: 16,
  },

  dangerCard: {
    backgroundColor: "#FFF5F5",
    borderColor: "#FAD5D3",
  },

});


export default ProfileScreen;