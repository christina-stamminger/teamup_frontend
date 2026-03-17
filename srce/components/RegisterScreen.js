import React, { useState, useCallback } from "react";
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useFormik } from "formik";
import * as Yup from "yup";
import get from "lodash.get";
import { Handshake } from "lucide-react-native";
import { useNetwork } from "../components/context/NetworkContext";
import Toast from "react-native-toast-message";
import { API_URL, APP_ENV } from "../config/env";
import PasswordInput from "../components/PasswordInput";

// Email und PW VALIDIERUNGSSCHEMA mit Yup
const usernameRegex = /^[A-Za-z0-9._-]{3,20}$/;

const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

const emailRegex =
  /^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

// ✅ Validation Schema – Deutsch
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

/*
// Falls du address später wieder brauchst:
address: Yup.object({
  streetNumber: Yup.string(),
  postalCode: Yup.string().length(4, "PLZ muss genau 4 Zeichen haben."),
  city: Yup.string(),
}),
*/

// ✅ API Request – jetzt mit safeFetch
const postNewUser = async (userData, safeFetch) => {
  try {
    console.log("Sending request to:", `${API_URL}/api/user/signup`);
    console.log("APP_ENV:", APP_ENV);
    console.log("With data:", {
      ...userData,
      password: "[REDACTED]",
    });

    const response = await safeFetch(`${API_URL}/api/user/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });

    // 🧭 1. Offline-Check
    if (response.offline) {
      return { success: false, message: "Keine Internetverbindung." };
    }

    // 🧭 2. Duplicate Username (409)
    if (response.status === 409) {
      return { success: false, message: "Benutzername existiert bereits." };
    }

    // 🧭 3. Erfolgreich
    if (response.ok) {
      return { success: true };
    }

    // 🧭 4. Fehlerhafte Antwort
    const data = await response.json().catch(() => ({}));
    return {
      success: false,
      message: data.message || "Fehler bei der Registrierung. Bitte erneut versuchen.",
    };
  } catch (error) {
    console.error("❌ Fehler bei der Registrierung:", error);
    return {
      success: false,
      message: "Netzwerkfehler. Bitte überprüfe deine Verbindung.",
    };
  }
};

const RegisterScreen = ({ navigation }) => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [registrationMessage, setRegistrationMessage] = useState("");
  const { safeFetch } = useNetwork();

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
      setRegistrationMessage("");
      setIsSubmitted(true);

      const userData = {
        username: values.username.trim(),
        email: values.email.trim().toLowerCase(),
        password: values.password, // ✅ Passwort niemals trimmen
      };

      const { success, message } = await postNewUser(userData, safeFetch);

      if (success) {
        Toast.show({
          type: "success",
          text1: "Konto erfolgreich erstellt!",
          text2: "Bitte melde dich jetzt an.",
        });

        navigation.navigate("Login");
        formik.resetForm();
        setIsSubmitted(false);
        return;
      } else {
        setRegistrationMessage(message);
        setIsSubmitted(false);
      }
    },
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
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.iconContainer}>
            <Handshake size={40} color="#fff" />
          </View>
          <Text style={styles.appName}>BringIt</Text>
        </View>

        <View style={styles.formWrapper}>
          <Text style={styles.title}>Registrieren</Text>

          <View style={styles.form}>
            {[
              { name: "username", placeholder: "Benutzername", type: "text" },
              { name: "email", placeholder: "E-Mail-Adresse", type: "email-address" },
            ].map(({ name, placeholder, type }) => {
              const fieldError = get(formik.errors, name);
              const fieldTouched = get(formik.touched, name);

              return (
                <View key={name} style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    name={name}
                    placeholder={placeholder}
                    placeholderTextColor="#999"
                    value={formik.values[name]}
                    onChangeText={(text) => {
                      if (registrationMessage) setRegistrationMessage("");
                      formik.handleChange(name)(text);
                    }}
                    onBlur={formik.handleBlur(name)}
                    keyboardType={type === "email-address" ? "email-address" : "default"}
                    secureTextEntry={false}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete={name === "email" ? "email" : "username"}
                    textContentType={name === "email" ? "emailAddress" : "username"}
                  />

                  {fieldTouched && fieldError && (
                    <Text style={styles.error}>{fieldError}</Text>
                  )}
                </View>
              );
            })}

            <View style={styles.inputContainer}>
              <PasswordInput
                value={formik.values.password}
                onChangeText={(text) => {
                  if (registrationMessage) setRegistrationMessage("");
                  formik.setFieldValue("password", text);
                }}
                onBlur={formik.handleBlur("password")}
                placeholder="Passwort"
                style={styles.passwordInput}
                textContentType="newPassword"
                autoComplete="new-password"
                passwordRules="minlength: 8; required: lower; required: upper; required: digit; required: special;"
              />

              {formik.touched.password && formik.errors.password && (
                <Text style={styles.error}>{formik.errors.password}</Text>
              )}
            </View>

            {registrationMessage ? (
              <Text style={styles.error}>{registrationMessage}</Text>
            ) : null}

            <TouchableOpacity
              style={[styles.button, isSubmitted && styles.buttonDisabled]}
              onPress={formik.handleSubmit}
              disabled={isSubmitted}
            >
              <Text style={styles.buttonText}>
                {isSubmitted ? "Registriere..." : "Registrieren"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.backButton} onPress={handleBackButton}>
              <Text style={styles.backButtonText}>Zurück</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  registrationSaved: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: "#4FB6B8",
    padding: 10,
    borderRadius: 5,
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 18,
  },
  hint: {
    fontSize: 12,
    color: "#666",
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
});

export default RegisterScreen;