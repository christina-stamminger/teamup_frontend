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
import * as SecureStore from "expo-secure-store";
import { jwtDecode } from "jwt-decode";
import { useUser } from "../components/context/UserContext";
import { useNetwork } from "../components/context/NetworkContext"; // ✅ safeFetch + shouldShowError

const LoginScreen = ({ navigation }) => {
  const [inputUsername, setInputUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  //const { setUserId, setUsername, setToken, setHasLoggedInOnce } = useUser();
  const { setUserId, setUsername, saveSession, setHasLoggedInOnce } = useUser();


  // ✅ Zugriff auf safeFetch aus dem NetworkContext
  const { isConnected, safeFetch, shouldShowError } = useNetwork();

  const handleLogin = async () => {
    if (!inputUsername.trim() || !password.trim()) {
      setErrorMessage("Bitte Benutzername und Passwort eingeben.");
      return;
    }

    try {
      console.log("LOGIN CALL → sending:", inputUsername, password);

      console.log("REQUEST BODY RAW →", {
        username: inputUsername,
        password: password
      });
      console.log("REQUEST BODY STRINGIFIED →", JSON.stringify({
        username: inputUsername,
        password: password
      }));
      //console.log("USERNAME RAW:", JSON.stringify(inputUsername));
      //console.log("USERNAME TRIMMED:", JSON.stringify(inputUsername.trim()));
      //console.log("🚀 LOGIN PRESSED with", inputUsername, password);
      //console.log("🚀 SENDING TO URL:", "http://192.168.50.116:8082/api/user/auth/login");


      const response = await safeFetch("http://192.168.50.116:8082/api/user/auth/login", {

        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({

          username: inputUsername,
          password,
        }),
      });

      if (response.offline) {
        setErrorMessage("Keine Internetverbindung.");
        return;
      }

      if (!response.ok) {
        setErrorMessage("Benutzername oder Passwort ungültig.");
        return;
      }

      const data = await response.json();

      // Neue Backend-API!
      const { accessToken, refreshToken, userId } = data;

      // Token decodieren
      const decoded = jwtDecode(accessToken);

      // ✔ Beste Methode: Context + SecureStore in EINEM Schritt
      await saveSession({
        userId,
        accessToken,
        refreshToken
      });

      // Username aus JWT
      setUsername(decoded.sub);
      setHasLoggedInOnce(true);

      navigation.replace("HomeTabs");

    } catch (error) {
      console.error("Login error:", error);

      if (shouldShowError()) {
        setErrorMessage("Ein Fehler ist aufgetreten. Bitte erneut versuchen.");
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <Pressable
        style={{ flex: 1 }}
        onPress={() => {
          console.log("Background tapped → dismissing keyboard");
          Keyboard.dismiss();
        }}
      >
        <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
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
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Passwort</Text>
                <PasswordInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Passwort eingeben"
                />
              </View>

              {/* 🔹 Passwort vergessen Link */}
              <Text
                style={styles.forgotPassword}
                onPress={() => navigation.navigate("ForgotPassword")}
              >
                Passwort vergessen?
              </Text>

              {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

              <TouchableOpacity style={styles.button} onPress={handleLogin}>
                <Text style={styles.buttonText}>Login</Text>
              </TouchableOpacity>

              <Text style={styles.registerText}>
                Noch kein Konto?{" "}
                <Text
                  style={styles.registerLink}
                  onPress={() => navigation.navigate("Register")}
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
