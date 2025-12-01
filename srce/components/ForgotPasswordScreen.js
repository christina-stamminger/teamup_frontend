import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
} from "react-native";

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [token, setToken] = useState(""); // ✅ add this

  const handlePasswordReset = async () => {
    if (!email.trim()) {
      Alert.alert("Input required", "Please enter your email.");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/user/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (response.ok || response.status === 404) {
        setSubmitted(true);
      } else {
        Alert.alert("Error", "Something went wrong. Please try again.");
      }
    } catch (error) {
      console.error("Reset error:", error);
      Alert.alert("Network Error", "Could not connect to server.");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.inner}>
          <View style={styles.card}>
            <Text style={styles.title}>Passwort zurücksetzen</Text>

            {submitted ? (
              <>
                <Text style={styles.confirmationText}>
                  Wenn du einen Account hast, haben wir dir einen Link zum Zurücksetzen des Passwortes an deine Email-Adresse geschickt.
                </Text>

                {/* ⬇️ Neu eingefügter Button */}
                <TouchableOpacity
                  style={[styles.button, { marginTop: 20 }]}
                  onPress={() => navigation.navigate("Login")}
                >
                  <Text style={styles.buttonText}>Zurück zum Login</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.label}>Gib deine Email-Adresse ein:</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  textContentType="emailAddress"
                />


                <TouchableOpacity style={styles.button} onPress={handlePasswordReset}>
                  <Text style={styles.buttonText}>Link senden</Text>
                </TouchableOpacity>

                <Text style={styles.backToLogin} onPress={() => navigation.goBack()}>
                  Zurück zum Login
                </Text>
              </>
            )}
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EAEAEA" },
  inner: { flex: 1, justifyContent: "center", alignItems: "center", padding: 16 },
  card: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#FFFFFF",
    padding: 24,
    borderRadius: 8,
    elevation: 5,
  },
  title: { fontSize: 20, fontWeight: "600", color: "#2A4D4D", textAlign: "center", marginBottom: 16 },
  label: { fontSize: 14, fontWeight: "500", color: "#4A7070", marginBottom: 8 },
  input: {
    height: 48,
    borderColor: "#5fc9c9",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  button: {
    backgroundColor: "#5fc9c9",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16,
  },
  buttonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
  confirmationText: { textAlign: "center", fontSize: 16, color: "#2A4D4D" },
  backToLogin: { textAlign: "center", color: "#5fc9c9", fontWeight: "600", marginTop: 8 },
});

export default ForgotPasswordScreen;
