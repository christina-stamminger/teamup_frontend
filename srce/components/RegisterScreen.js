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
import { Eye, EyeOff } from "lucide-react-native";
import { Handshake } from "lucide-react-native";
import { useNetwork } from "../components/context/NetworkContext"; // ✅ safeFetch + shouldShowError
import Toast from "react-native-toast-message";
import Constants from "expo-constants";

const API_URL = Constants.expoConfig.extra.API_URL;

// Email und PW VALIDIERUNGSCHEMA mit Yup
const usernameRegex = /^[A-Za-z0-9._-]{3,20}$/;

const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

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

  /*
  address: Yup.object({
    streetNumber: Yup.string(),
    postalCode: Yup.string().length(4, "PLZ muss genau 4 Zeichen haben."),
    city: Yup.string(),
  }),
  */
});




// ✅ API Request – jetzt mit safeFetch
const postNewUser = async (userData, safeFetch) => {
  try {
    console.log("Sending request to:", `${API_URL}/api/user/signup`);
    console.log("With data:", userData);
    // ⚙️ safeFetch statt fetch → funktioniert auch offline
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
  const [showPassword, setShowPassword] = useState(false);

  const { safeFetch } = useNetwork(); // ✅ Zugriff auf safeFetch aus Context

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  const formik = useFormik({
    initialValues: {
      username: "",
      email: "",
      password: "",
    },
    validationSchema,
    onSubmit: async (values) => {
      const userData = {
        username: values.username.trim(),
        email: values.email.trim(),
        password: values.password.trim(),
      };

      // ✅ Registrierung über safeFetch
      const { success, message } = await postNewUser(userData, safeFetch);

      if (success) {
        Toast.show({
          type: "success",
          text1: "Konto erfolgreich erstellt!",
          text2: "Bitte melde dich jetzt an.",
        });

        navigation.navigate("Login");
        formik.resetForm();
        return;
      }
      else {
        setRegistrationMessage(message);
      }
    },
  });

  const handleBackButton = () => {
    navigation.goBack();
  };


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
              { name: "password", placeholder: "Passwort", type: "password" },
            ].map(({ name, placeholder, type }) => {
              const fieldError = get(formik.errors, name);
              const fieldTouched = get(formik.touched, name);

              if (name === "password") {
                return (
                  <View key={name} style={styles.inputContainer}>
                    <View style={styles.passwordContainer}>
                      <TextInput
                        style={styles.passwordInput}
                        name={name}
                        placeholder={placeholder}
                        value={get(formik.values, name)}
                        onChangeText={formik.handleChange(name)}
                        onBlur={formik.handleBlur(name)}
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                      />
                      <TouchableOpacity
                        onPress={togglePasswordVisibility}
                        hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                        activeOpacity={0.7}
                        style={styles.eyeButton}
                      >
                        {showPassword ? (
                          <EyeOff size={22} color="#666" />
                        ) : (
                          <Eye size={22} color="#666" />
                        )}
                      </TouchableOpacity>
                    </View>
                    {fieldTouched && fieldError && (
                      <Text style={styles.error}>{fieldError}</Text>
                    )}
                  </View>
                );
              }

              return (
                <View key={name} style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    name={name}
                    placeholder={placeholder}
                    placeholderTextColor="#999"
                    value={formik.values[name]}
                    onChangeText={formik.handleChange(name)}
                    onBlur={formik.handleBlur(name)}
                    keyboardType={type === "email-address" ? "email-address" : "default"}
                    secureTextEntry={false}
                  />

                  {fieldTouched && fieldError && (
                    <Text style={styles.error}>{fieldError}</Text>
                  )}
                </View>
              );
            })}

            {registrationMessage && (
              <Text style={styles.error}>{registrationMessage}</Text>
            )}

            <TouchableOpacity style={styles.button} onPress={formik.handleSubmit}>
              <Text style={styles.buttonText}>Registrieren</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.backButton} onPress={handleBackButton}>
              <Text style={styles.buttonText}>Zurück</Text>
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
    fontWeight: "500",   // wichtig!
    letterSpacing: 0.6,  // extrem wirkungsvoll
    color: "#666",
  },
  title: {
    fontSize: 22,
    marginBottom: 20,
    textAlign: "center",
    color: "#404040", // ruhiger
  },
  inputContainer: {
    marginBottom: 15,
  },
  input: {
    height: 48,
    borderRadius: 8,
    paddingLeft: 10,
    backgroundColor: "#fff",
    fontSize: 16,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderColor: "#ccc",
    backgroundColor: "#fff",
  },
  passwordInput: {
    flex: 1,
    height: 48,
    paddingLeft: 10,
    fontSize: 16,
  },
  eyeButton: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    justifyContent: "center",
    alignItems: "center",
  },
button: {
  backgroundColor: "#4FB6B8",
  height: 52,
  borderRadius: 10,
  alignItems: "center",
  justifyContent: "center",
  marginVertical: 12,
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
  error: {
    color: "red",
    fontSize: 12,
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
