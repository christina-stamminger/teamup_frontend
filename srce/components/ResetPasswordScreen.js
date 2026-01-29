import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { API_URL } from "../../config/env";


export default function ResetPasswordScreen({ route, navigation }) {
  const { token } = route.params || {};

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleReset = async () => {
    if (!password.trim()) {
      Alert.alert("Error", "Please enter a new password.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/user/auth/update-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });

      if (response.ok) {
        Alert.alert("Success", "Password updated. You can now log in.", [
          { text: "OK", onPress: () => navigation.navigate("Login") },
        ]);
      } else {
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.message || "Reset failed. Try again.";
        Alert.alert("Error", errorMessage);
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Network Error", "Failed to connect to server.");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.inner}>
          <Text style={styles.title}>Set New Password</Text>

          <TextInput
            style={styles.input}
            secureTextEntry
            placeholder="New Password"
            value={password}
            onChangeText={setPassword}
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            secureTextEntry
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            autoCapitalize="none"
          />

          <TouchableOpacity style={styles.button} onPress={handleReset}>
            <Text style={styles.buttonText}>Passwort zurücksetzen</Text>
          </TouchableOpacity>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  inner: { flex: 1, justifyContent: "center", padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "#ccc",
    marginBottom: 15,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  button: {
    backgroundColor: "#1e90ff",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
  },
  buttonText: { color: "white", fontSize: 16, fontWeight: "bold" },
});
