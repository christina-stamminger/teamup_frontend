import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
  Keyboard,
  TouchableOpacity,
} from "react-native";
import { Handshake } from "lucide-react-native";
import UsernameInput from "./UsernameInput";
import PasswordInput from "./PasswordInput";
import { useUser } from "../components/context/UserContext";
import { useNetwork } from "../components/context/NetworkContext";
import Constants from "expo-constants";
import Toast from "react-native-toast-message";

const API_URL = Constants.expoConfig.extra.API_URL;

const LoginScreen = ({ navigation }) => {
  const [inputUsername, setInputUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { saveSession } = useUser();
  const { safeFetch } = useNetwork();

  const handleLogin = async () => {
    // Validierung
    if (!inputUsername.trim() || !password.trim()) {
      setErrorMessage("Bitte Benutzername und Passwort eingeben.");
      return;
    }

    // Verhindere doppelte Login-Versuche
    if (isLoading) return;

    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await safeFetch(
        `${API_URL}/api/user/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: inputUsername,
            password,
          }),
        }
      );

      // Offline
      if (response?.offline) {
        Toast.show({
          type: 'info',
          text1: 'Offline',
          text2: 'Keine Internetverbindung',
        });
        return;
      }

      // Login fehlgeschlagen
      if (!response.ok) {
        setErrorMessage("Benutzername oder Passwort ungültig.");
        return;
      }

      // ✅ Login erfolgreich
      const data = await response.json();
      const { accessToken, refreshToken } = data;

      // ✅ Session speichern (lädt automatisch User-Daten)
      await saveSession({ accessToken, refreshToken });

      // ✅ saveSession setzt hasLoggedInOnce bereits auf true
      // ✅ Navigation erfolgt automatisch durch AppRoot

    } catch (error) {
      console.error("Login error:", error);
      setErrorMessage("Ein Fehler ist aufgetreten. Bitte erneut versuchen.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <Pressable
        style={{ flex: 1 }}
        onPress={Keyboard.dismiss}
      >
        <ScrollView 
          contentContainerStyle={styles.inner} 
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <View style={styles.logoContainer}>
            <View style={styles.iconContainer}>
              <Handshake size={40} color="#fff" />
            </View>
            <Text style={styles.appName}>BringIt</Text>
          </View>

          {/* Login Card */}
          <View style={styles.card}>
            <Text style={styles.title}>Willkommen bei Bringit</Text>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Benutzername</Text>
                <UsernameInput
                  value={inputUsername}
                  onChangeText={setInputUsername}
                  placeholder="Benutzername eingeben"
                  editable={!isLoading}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Passwort</Text>
                <PasswordInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Passwort eingeben"
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                  importantForAutofill="no"
                  keyboardType="default"
                  accessibilityLabel="Passwort"
                  accessibilityRole="text"
                />
              </View>

              {/* Passwort vergessen Link */}
              <Text
                style={styles.forgotPassword}
                onPress={() => !isLoading && navigation.navigate("ForgotPassword")}
              >
                Passwort vergessen?
              </Text>

              {errorMessage ? (
                <Text style={styles.errorText}>{errorMessage}</Text>
              ) : null}

              <TouchableOpacity 
                style={[styles.button, isLoading && styles.buttonDisabled]} 
                onPress={handleLogin}
                disabled={isLoading}
              >
                <Text style={styles.buttonText}>
                  {isLoading ? "Wird angemeldet..." : "Login"}
                </Text>
              </TouchableOpacity>

              <Text style={styles.registerText}>
                Noch kein Konto?{" "}
                <Text
                  style={styles.registerLink}
                  onPress={() => !isLoading && navigation.navigate("Register")}
                >
                  Hier registrieren
                </Text>
              </Text>
            </View>
          </View>

          <Text style={styles.footer}>© 2025 BringIt. Alle Rechte vorbehalten.</Text>
        </ScrollView>
      </Pressable>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 30,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  iconContainer: {
    backgroundColor: "#5FC9C9",
    padding: 20,
    borderRadius: 50,
  },
  appName: {
    marginTop: 10,
    fontSize: 24,
  },
  card: {
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 20,
    elevation: 3,
  },
  title: {
    fontSize: 20,
    marginBottom: 20,
    textAlign: "center",
    color: "#404040"
  },
  form: {},
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    marginBottom: 5,
    color: "#404040",
  },
  forgotPassword: {
    marginTop: 1,
    textAlign: "right",
    color: "#5FC9C9",
  },
  errorText: {
    color: "red",
    marginVertical: 10,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#5FC9C9",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: "#a0d9d9",
    opacity: 0.7,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
  },
  registerText: {
    marginTop: 15,
    textAlign: "center",
  },
  registerLink: {
    color: "#5FC9C9",
    fontWeight: "bold",
  },
  footer: {
    textAlign: "center",
    marginTop: 20,
    color: "#888",
  },
});

export default LoginScreen;