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
        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <View style={styles.iconContainer}>
              <Handshake size={40} color="#fff" />
            </View>
            <Text style={styles.appName}>BringIt</Text>
          </View>

          <Text style={styles.title}>Hi, schön dass du da bist.</Text>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Benutzername oder Email</Text>
              <UsernameInput
                value={inputUsername}
                onChangeText={(text) => {
                  if (errorMessage) setErrorMessage("");
                  setInputUsername(text);
                }}
                placeholder="zB max1 oder max1@mail.com"
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
  container: {
    flex: 1,
    backgroundColor: "#F7F8FA",
  },

  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
  },

  content: {
    width: "100%",
    maxWidth: 460,
    alignSelf: "center",
  },

  logoContainer: {
    alignItems: "center",
    marginBottom: 28,
  },

  iconContainer: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: "#4FB6B8",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#4FB6B8",
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },

  appName: {
    marginTop: 14,
    fontSize: 30,
    fontWeight: "700",
    letterSpacing: -0.4,
    color: "#12151A",
  },

  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 28,
    textAlign: "center",
    color: "#1F2937",
  },

  form: {
    width: "100%",
  },

  inputGroup: {
    marginBottom: 14,
  },

  label: {
    marginBottom: 7,
    marginLeft: 2,
    fontSize: 12,
    fontWeight: "600",
    color: "#7C8492",
  },

  forgotPassword: {
    marginTop: 2,
    textAlign: "right",
    color: "#3FA9AB",
    fontSize: 13,
    fontWeight: "600",
  },

  errorText: {
    color: "#B42318",
    backgroundColor: "#FEF3F2",
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginTop: 14,
    textAlign: "center",
    fontSize: 13,
    lineHeight: 18,
  },

  button: {
    backgroundColor: "#3FA9AB",
    minHeight: 54,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22,
    shadowColor: "#3FA9AB",
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  buttonDisabled: {
    backgroundColor: "#A9DADB",
    shadowOpacity: 0,
    elevation: 0,
    opacity: 0.8,
  },

  registerText: {
    marginTop: 22,
    textAlign: "center",
    color: "#7C8492",
    fontSize: 14,
  },

  registerLink: {
    color: "#3FA9AB",
    fontWeight: "700",
  },
});

export default LoginScreen;