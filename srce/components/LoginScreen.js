import React, { useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from "react-native";
import { Handshake } from "lucide-react-native";
import UsernameInput from "./UsernameInput";
import PasswordInput from "./PasswordInput";
import { useUser } from "../components/context/UserContext";
import { useNetwork } from "../components/context/NetworkContext";
import Toast from "react-native-toast-message";
import { API_URL } from "../config/env";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { autofill } from "../utils/autofill";

const LoginScreen = ({ navigation }) => {
  const [inputUsername, setInputUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { saveSession } = useUser();
  const { safeFetch } = useNetwork();
  const insets = useSafeAreaInsets();

  const passwordRef = useRef(null);

  const handleLogin = useCallback(async () => {
    Keyboard.dismiss();

    if (!inputUsername.trim() || !password) {
      setErrorMessage("Bitte Benutzername und Passwort eingeben.");
      return;
    }

    if (isLoading) return;

    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await safeFetch(`${API_URL}/api/user/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: inputUsername.trim(),
          password,
        }),
      });

      if (response?.offline) {
        Toast.show({
          type: "info",
          text1: "Offline",
          text2: "Keine Internetverbindung",
        });
        return;
      }

      if (!response.ok) {
        setErrorMessage("Benutzername oder Passwort ungültig.");
        return;
      }

      const data = await response.json();
      const { accessToken, refreshToken } = data;

      await saveSession({ accessToken, refreshToken });
      // Navigation erfolgt über AppRoot
    } catch (error) {
      console.error("Login error:", error);
      setErrorMessage("Ein Fehler ist aufgetreten. Bitte erneut versuchen.");
    } finally {
      setIsLoading(false);
    }
  }, [inputUsername, password, isLoading, safeFetch, saveSession]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 30}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContainer,
          {
            paddingTop: Math.max(insets.top + 60, 100),
            paddingBottom: 30 + insets.bottom,
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <View style={styles.logoContainer}>
            <View style={styles.iconContainer}>
              <Handshake size={40} color="#fff" />
            </View>
            <Text style={styles.appName}>BringIt</Text>
          </View>

          <Text style={styles.title}>Hi, schön dass du da bist.</Text>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Benutzername</Text>
              <UsernameInput
                value={inputUsername}
                onChangeText={(text) => {
                  if (errorMessage) setErrorMessage("");
                  setInputUsername(text);
                }}
                placeholder="z. B. bringitUser1"
                editable={!isLoading}
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                {...autofill.username}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Passwort</Text>
              <PasswordInput
                ref={passwordRef}
                value={password}
                onChangeText={(text) => {
                  if (errorMessage) setErrorMessage("");
                  setPassword(text);
                }}
                placeholder="••••••••"
                editable={!isLoading}
                accessibilityLabel="Passwort"
                returnKeyType="done"
                onSubmitEditing={handleLogin}
                {...autofill.password}
              />
            </View>

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
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
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
    fontWeight: "500",
    letterSpacing: 0.6,
    color: "#666",
  },
  title: {
    fontSize: 18,
    marginBottom: 24,
    textAlign: "center",
    color: "#404040",
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
    flexGrow: 1,
    padding: 30,
  },
});

export default LoginScreen;