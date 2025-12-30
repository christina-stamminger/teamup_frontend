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

              <Pressable
                onPress={handleLogin}
                disabled={isLoading}
                style={({ pressed }) => [
                  styles.button,
                  pressed && { opacity: 0.85 },
                  isLoading && styles.buttonDisabled,
                ]}
              >
                <Text style={styles.buttonText}>
                  {isLoading ? "Wird angemeldet…" : "Anmelden"}
                </Text>
              </Pressable>

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
    padding: 22,
    borderRadius: 999,
    shadowColor: "#5FC9C9",
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  appName: {
    marginTop: 12,
    fontSize: 26,
    fontWeight: "700",
    color: "#1f2933", // dunkler, hochwertiger
  },
  title: {
    fontSize: 18,
    marginBottom: 24,
    textAlign: "center",
    color: "#6b7280", // ruhiger
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  form: {},
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    marginBottom: 6,
    fontSize: 13,
    color: "#6b7280",
  },
  forgotPassword: {
    marginTop: 1,
    textAlign: "right",
    color: "#5FC9C9",
  },
  errorText: {
    color: "#dc2626",
    backgroundColor: "#fee2e2",
    padding: 10,
    borderRadius: 8,
    marginVertical: 12,
    textAlign: "center",
    fontSize: 14,
  },
  button: {
    backgroundColor: "#5FC9C9",
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
  },
  buttonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
  },
  buttonDisabled: {
    backgroundColor: "#a0d9d9",
    opacity: 0.7,
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
    marginTop: 30,
    fontSize: 12,
    color: "#9ca3af",
  }
});

export default LoginScreen;