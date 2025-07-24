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
  TouchableWithoutFeedback
} from "react-native";
import { Handshake } from "lucide-react-native";
import UsernameInput from "./UsernameInput";
import PasswordInput from "./PasswordInput";
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from 'jwt-decode';
import { useUser } from '../components/context/UserContext';

const LoginScreen = ({ navigation }) => {
  const [inputUsername, setInputUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const { setUserId, setUsername, setToken, setHasLoggedInOnce } = useUser();

  const handleLogin = async () => {
    if (!inputUsername.trim() || !password.trim()) {
      setErrorMessage("Invalid username or password.");
      return;
    }

    try {
      const response = await fetch("http://192.168.50.116:8082/api/user/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: inputUsername,
          password,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const { token } = data;
        const decoded = jwtDecode(token);
        const userId = decoded.userId ?? decoded.sub;
        if (!userId) throw new Error("User ID not found in token");

        await SecureStore.setItemAsync('authToken', token);
        await SecureStore.setItemAsync('userId', userId.toString());

        setUserId(userId);
        setUsername(decoded.sub);
        setToken(token);
        setHasLoggedInOnce(true);

        navigation.replace('HomeTabs');
      } else {
        setErrorMessage("Invalid login credentials");
      }
    } catch (error) {
      console.error("Login error:", error);
      setErrorMessage("An error occurred. Please try again.");
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

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.title}>Welcome to BringIt</Text>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Username</Text>
                <UsernameInput
                  value={inputUsername}
                  onChangeText={setInputUsername}
                  placeholder="Enter username"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <PasswordInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter password"
                />
              </View>

              <Text
                style={styles.forgotPassword}
                onPress={() => navigation.navigate("ForgotPassword")}
              >
                Forgot password?
              </Text>

              {errorMessage ? (
                <Text style={styles.errorText}>{errorMessage}</Text>
              ) : null}

              <TouchableOpacity style={styles.button} onPress={handleLogin}>
                <Text style={styles.buttonText}>Login</Text>
              </TouchableOpacity>

              <Text style={styles.registerText}>
                Don’t have an account?{" "}
                <Text
                  style={styles.registerLink}
                  onPress={() => navigation.navigate("Register")}
                >
                  Register here
                </Text>
              </Text>
            </View>
          </View>

          <Text style={styles.footer}>© 2025 BringIt. All rights reserved.</Text>
        </ScrollView>
      </Pressable>
    </KeyboardAvoidingView>
  );
}

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
    fontWeight: "bold",
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
