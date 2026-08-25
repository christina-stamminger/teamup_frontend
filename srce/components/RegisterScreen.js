import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from "react-native";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Handshake } from "lucide-react-native";
import { useNetwork } from "../components/context/NetworkContext";
import Toast from "react-native-toast-message";
import { API_URL, APP_ENV } from "../config/env";
import PasswordInput from "../components/PasswordInput";
import UsernameInput from "../components/UsernameInput";
import { autofill } from "../utils/autofill";

// Validierung
const usernameRegex = /^[A-Za-z0-9._-]{3,20}$/;
const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])\S{8,}$/;
const emailRegex =
  /^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

const validationSchema = Yup.object({
  username: Yup.string()
    .matches(
      usernameRegex,
      "Benutzername muss 3–20 Zeichen haben. Erlaubt: Buchstaben, Zahlen, ., -, _."
    )
    .required("Benutzername ist erforderlich."),
  email: Yup.string()
    .matches(emailRegex, "Bitte gib eine gültige E-Mail ein.")
    .required("E-Mail ist erforderlich."),
  password: Yup.string()
    .matches(
      passwordRegex,
      "Passwort muss min. 8 Zeichen, Groß-/Kleinbuchstaben, Zahl & Sonderzeichen enthalten."
    )
    .required("Passwort ist erforderlich."),
});

const postNewUser = async (userData, safeFetch) => {
  try {
    console.log(
      "Sending request to:",
      `${API_URL}/api/user/signup`
    );

    console.log("APP_ENV:", APP_ENV);

    const response = await safeFetch(
      `${API_URL}/api/user/signup`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      }
    );

    if (response?.offline) {
      return {
        success: false,
        message: "Keine Internetverbindung.",
      };
    }

    const data =
      await response.json().catch(() => ({}));

    if (response.ok) {
      return {
        success: true,
      };
    }

    const backendErrors =
      data.errorMessages ||
      data.errorMessage ||
      data.errors ||
      data.message;


    let backendMessage = null;


    if (Array.isArray(backendErrors)) {

      backendMessage =
        backendErrors[0];

    } else if (
      typeof backendErrors === "string"
    ) {

      backendMessage =
        backendErrors;
    }


    return {
      success: false,

      message:
        backendMessage ||
        "Registrierung mit diesen Angaben nicht möglich. Bitte überprüfe deine Eingaben.",
    };

  } catch (error) {
    console.error(
      "❌ Fehler bei der Registrierung:",
      error
    );

    return {
      success: false,
      message:
        "Netzwerkfehler. Bitte überprüfe deine Verbindung.",
    };
  }
};

const RegisterScreen = ({ navigation }) => {

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [registrationMessage, setRegistrationMessage] = useState("");

  const [usernameAvailable, setUsernameAvailable] =
    useState(null);

  const [checkingUsername, setCheckingUsername] =
    useState(false);
  const { safeFetch } = useNetwork();

  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  const handleRegisterPress = () => {
    passwordRef.current?.blur();

    setTimeout(() => {
      formik.handleSubmit();
    }, 50);
  };

  useEffect(() => {
    console.log("🟢 [RegisterScreen] mounted");

    return () => {
      console.log("🔴 [RegisterScreen] unmounted");
    };
  }, []);

  const handleBackButton = useCallback(() => {
    navigation.goBack();
  }, [navigation]);



  const formik = useFormik({
    initialValues: {
      username: "",
      email: "",
      password: "",
    },
    validationSchema,
    onSubmit: async (values) => {
      console.log("🚀 [SUBMIT] password:", values.password);
      console.log("🚀 [SUBMIT] password length:", values.password?.length);
      setRegistrationMessage("");
      setIsSubmitted(true);

      const userData = {
        username: values.username.trim(),
        email: values.email.trim().toLowerCase(),
        password: values.password,
      };

      console.log("📤 [REQUEST PAYLOAD]", {
        username: userData.username,
        email: userData.email,
        passwordLength: userData.password?.length,
      });

      const { success, message } = await postNewUser(userData, safeFetch);

      console.log("📥 [REGISTER RESULT]", { success, message });

      if (success) {
        console.log("✅ [SUCCESS] start");

        Toast.show({
          type: "success",
          text1: "Konto erfolgreich erstellt!",
          text2: "Bitte melde dich jetzt an.",
        });

        setIsSubmitted(false);

        console.log("✅ [SUCCESS] end");
        return;
      }

      setRegistrationMessage(message);
      setIsSubmitted(false);
    },
  });

  useEffect(() => {

    const username =
      formik?.values?.username?.trim();

    /*
     * Solange die lokale Syntax noch nicht stimmt,
     * kein Request ans Backend.
     */
    if (
      !username ||
      !usernameRegex.test(username)
    ) {
      setUsernameAvailable(null);
      setCheckingUsername(false);
      return;
    }


    setUsernameAvailable(null);


    /*
     * Debounce:
     * Nicht bei jedem einzelnen Tastendruck
     * sofort einen Request senden.
     */
    const timer =
      setTimeout(async () => {

        try {

          setCheckingUsername(true);

          const response =
            await safeFetch(
              `${API_URL}/api/user/username-available?username=${encodeURIComponent(username)}`,
              {
                method: "GET",
              }
            );

          console.log(
            "🔎 USERNAME CHECK:",
            username,
            "| status:",
            response?.status,
            "| ok:",
            response?.ok
          );


          if (
            response?.offline ||
            !response?.ok
          ) {
            setUsernameAvailable(null);
            return;
          }


          const data =
            await response.json();


          setUsernameAvailable(
            data?.available === true
          );

        } catch (error) {

          console.error(
            "Username availability check failed:",
            error
          );

          /*
           * Availability-Check darf das
           * Registrieren nicht blockieren.
           */
          setUsernameAvailable(null);

        } finally {

          setCheckingUsername(false);
        }

      }, 450);


    return () =>
      clearTimeout(timer);

  }, [
    formik?.values?.username,
    safeFetch,
  ]);

  useEffect(() => {
    console.log("🧠 [Formik state] password:", formik.values.password, "| length:", formik.values.password?.length);
  }, [formik.values.password]);

  console.log("🖥️ [RegisterScreen render]", {
    username: formik.values.username,
    email: formik.values.email,
    password: formik.values.password,
    passwordLength: formik.values.password?.length,
    isSubmitted,
    registrationMessage,
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollViewContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoContainer}>
          <View style={styles.iconContainer}>
            <Handshake size={40} color="#fff" />
          </View>
          <Text style={styles.appName}>BringIt</Text>
        </View>

        <View style={styles.formWrapper}>
          <Text style={styles.title}>Registrieren</Text>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <UsernameInput
                value={formik.values.username}
                onChangeText={(text) => {

                  if (registrationMessage) {
                    setRegistrationMessage("");
                  }

                  /*
                   * Alte Availability-Anzeige sofort entfernen,
                   * sobald weitergetippt wird.
                   */
                  setUsernameAvailable(null);

                  formik.setFieldValue(
                    "username",
                    text
                  );
                }}
                onBlur={formik.handleBlur("username")}
                placeholder="Benutzername"
                returnKeyType="next"
                editable={!isSubmitted}
                onSubmitEditing={() => emailRef.current?.focus()}
                {...autofill.username}
              />
              {formik.touched.username && formik.errors.username ? (
                <Text style={styles.error}>{formik.errors.username}</Text>
              ) : null}

              {!formik.errors.username &&
                checkingUsername && (

                  <Text style={styles.usernameChecking}>
                    Verfügbarkeit wird geprüft ...
                  </Text>

                )}


              {!formik.errors.username &&
                !checkingUsername &&
                usernameAvailable === true && (

                  <Text style={styles.usernameAvailable}>
                    ✓ Benutzername verfügbar
                  </Text>

                )}


              {!formik.errors.username &&
                !checkingUsername &&
                usernameAvailable === false && (

                  <Text style={styles.usernameUnavailable}>
                    Benutzername bereits vergeben.
                  </Text>

                )}
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                ref={emailRef}
                style={styles.input}
                placeholder="E-Mail-Adresse"
                placeholderTextColor="#999"
                value={formik.values.email}
                onChangeText={(text) => {
                  if (registrationMessage) setRegistrationMessage("");
                  formik.setFieldValue("email", text);
                }}
                onBlur={formik.handleBlur("email")}
                keyboardType="email-address"
                editable={!isSubmitted}
                autoCapitalize="none"
                autoCorrect={false}
                spellCheck={false}
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                {...autofill.email}
              />
              {formik.touched.email && formik.errors.email ? (
                <Text style={styles.error}>{formik.errors.email}</Text>
              ) : null}
            </View>

            <View style={styles.inputContainer}>
              <PasswordInput
                ref={passwordRef}

                value={formik.values.password}

                onChangeText={(text) => {
                  if (registrationMessage) {
                    setRegistrationMessage("");
                  }

                  formik.setFieldValue(
                    "password",
                    text,
                    false
                  );
                }}

                onNativeChange={(text) => {
                  if (
                    Platform.OS === "ios" &&
                    text &&
                    text !== formik.values.password
                  ) {
                    formik.setFieldValue(
                      "password",
                      text,
                      false
                    );
                  }
                }}

                onEndEditing={async (event) => {
                  const nativeText =
                    event?.nativeEvent?.text ?? "";

                  if (
                    Platform.OS === "ios" &&
                    nativeText &&
                    nativeText !== formik.values.password
                  ) {
                    await formik.setFieldValue(
                      "password",
                      nativeText,
                      false
                    );
                  }

                  await formik.setFieldTouched(
                    "password",
                    true,
                    true
                  );
                }}

                onBlur={() => {
                  formik.setFieldTouched(
                    "password",
                    true,
                    false
                  );
                }}

                placeholder="Passwort"
                style={styles.passwordInput}
                returnKeyType="done"
                editable={!isSubmitted}

                onSubmitEditing={
                  handleRegisterPress
                }

                {...autofill.newPassword}
              />
              {formik.touched.password && formik.errors.password ? (
                <Text style={styles.error}>{formik.errors.password}</Text>
              ) : null}
            </View>

            {registrationMessage ? (
              <Text style={styles.error}>{registrationMessage}</Text>
            ) : null}
            <TouchableOpacity
              style={[
                styles.button,

                (isSubmitted ||
                  usernameAvailable === false) &&
                styles.buttonDisabled,
              ]}

              onPress={handleRegisterPress}

              disabled={
                isSubmitted ||
                usernameAvailable === false
              }
            >
              {isSubmitted ? (
                <View style={styles.buttonContent}>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.buttonTextLoading}>Registriere...</Text>
                </View>
              ) : (
                <Text style={styles.buttonText}>Registrieren</Text>
              )}
            </TouchableOpacity>

            {isSubmitted ? (
              <View style={styles.processingBox}>
                <Text style={styles.processingTitle}>Registrierung läuft</Text>
                <Text style={styles.processingText}>
                  Die Registrierung kann ein paar Sekunden dauern.
                  Bitte hab etwas Geduld und unterbreche den Vorgang nicht.
                </Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[
                styles.backButton,
                isSubmitted && styles.backButtonDisabled
              ]}
              onPress={handleBackButton}
              disabled={isSubmitted}
            >
              <Text style={styles.backButtonText}>Zurück</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView >
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  scrollViewContainer: {
    flexGrow: 1,
    justifyContent: "center",
    paddingBottom: 20,
  },
  formWrapper: {
    alignItems: "center",
    width: "100%",
  },
  form: {
    width: "100%",
  },
  appName: {
    marginTop: 12,
    fontSize: 30,
    fontWeight: "500",
    letterSpacing: 0.6,
    color: "#666",
  },
  title: {
    fontSize: 22,
    marginBottom: 20,
    textAlign: "center",
    color: "#404040",
  },
  inputContainer: {
    marginBottom: 15,
  },
  input: {
    height: 48,
    borderRadius: 8,
    paddingLeft: 10,
    paddingRight: 10,
    backgroundColor: "#fff",
    fontSize: 16,
    color: "#000",
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
    color: "#000",
    paddingLeft: 0,
  },
  button: {
    backgroundColor: "#4FB6B8",
    height: 52,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 12,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
  },
  backButton: {
    backgroundColor: "#e0e0e0",
    minHeight: 48,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 8,
  },
  backButtonText: {
    color: "#404040",
    fontSize: 16,
  },
  error: {
    color: "red",
    fontSize: 12,
    marginTop: 4,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  iconContainer: {
    backgroundColor: "#4FB6B8",
    padding: 20,
    borderRadius: 50,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
  buttonTextLoading: {
    color: "#fff",
    fontSize: 16,
  },
  processingBox: {
    marginTop: 4,
    marginBottom: 8,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#eef8f8",
    borderWidth: 1,
    borderColor: "#cfeaea",
  },
  processingTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2f6f70",
    marginBottom: 4,
  },
  processingText: {
    fontSize: 13,
    lineHeight: 18,
    color: "#4b6667",
  },
  backButtonDisabled: {
    opacity: 0.6,
  },

  //username checking
  usernameChecking: {
    marginTop: 5,
    fontSize: 12,
    color: "#8A8F95",
  },

  usernameAvailable: {
    marginTop: 5,
    fontSize: 12,
    fontWeight: "600",
    color: "#2B8A8C",
  },

  usernameUnavailable: {
    marginTop: 5,
    fontSize: 12,
    color: "#DC2626",
  },
});

export default RegisterScreen;