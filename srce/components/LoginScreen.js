import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Keyboard,
} from "react-native";
import { Handshake } from "lucide-react-native";
import UsernameInput from "./UsernameInput";
import PasswordInput from "./PasswordInput";
import { useUser } from "../components/context/UserContext";
import { useNetwork } from "../components/context/NetworkContext";
import Toast from "react-native-toast-message";
import { API_URL } from "../../config/env";


const LoginScreen = ({ navigation }) => {
  const [inputUsername, setInputUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { saveSession } = useUser();
  const { safeFetch } = useNetwork();

  const handleLogin = async () => {
    Keyboard.dismiss();
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
    <View style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="always"
      >
        <View style={styles.centerWrapper}>
          <View style={styles.card}>

            {/* Logo */}
            <View style={styles.logoContainer}>
              <View style={styles.iconContainer}>
                <Handshake size={40} color="#fff" />
              </View>
              <Text style={styles.appName}>BringIt</Text>
            </View>

            {/* Login Card */}
            <Text style={styles.title}>Hi, schön dass du da bist.</Text>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Benutzername</Text>
                <UsernameInput
                  value={inputUsername}
                  onChangeText={setInputUsername}
                  placeholder="zB bringitUser1"
                  editable={!isLoading}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Passwort</Text>
                <PasswordInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="********"
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
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: {
    padding: 30,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 8,
  },
  iconContainer: {
    backgroundColor: "#4FB6B8",
    padding: 22,
    borderRadius: 999,
    shadowColor: "#4FB6B8",
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  appName: {
    marginTop: 12,
    fontSize: 30,
    fontWeight: "500",   // wichtig!
    letterSpacing: 0.6,  // extrem wirkungsvoll
    color: "#666",
  },
  title: {
    fontSize: 18,
    marginBottom: 24,
    textAlign: "center",
    color: "#404040", // ruhiger
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#666",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  form: {},
  inputGroup: {
    marginBottom: 8,
  },
  label: {
    marginBottom: 6,
    fontSize: 13,
    color: "#6b7280",
  },
  forgotPassword: {
    marginTop: 1,
    textAlign: "right",
    color: "#4FB6B8",
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
    backgroundColor: "#4FB6B8",
    height: 52,
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
    color: "#666",
  },
  registerLink: {
    color: "#4FB6B8",
    fontWeight: "bold",
  },
  scrollContainer: {
    flexGrow: 1,     // ⬅️ DAS ist der Schlüssel
    padding: 30,
  },

  centerWrapper: {
    flex: 1,                 // ⬅️ gibt Höhe
    justifyContent: "center" // ⬅️ kann jetzt wirken
  },

});

export default LoginScreen;