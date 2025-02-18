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
} from "react-native";
import { Handshake } from "lucide-react-native"; // Lucide-react-native library for icons
import PasswordInput from "./PasswordInput";

const LoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState(""); // For displaying errors

  const handleLogin = async () => {
    try {
      const response = await fetch("http://192.168.50.116:8082/api/user/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      // Check if the login was successful
      if (response.ok) {
        const data = await response.json();
        const { token } = data;  // Assuming the JWT token is sent under 'token'
        
        // Store the token in your app's state or secure storage
        console.log("JWT Token:", token);

        // You can store it in React Native's AsyncStorage or SecureStorage for persistence
        // await AsyncStorage.setItem("userToken", token);

        // Navigate to the home screen or authenticated area
        navigation.replace('HomeTabs');
      } else {
        const data = await response.json();
        setErrorMessage(data.message || "Invalid login credentials");
      }
    } catch (error) {
      setErrorMessage("An error occurred. Please try again.");
      console.error("Login error", error);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.inner}>
          {/* Logo and Name */}
          <View style={styles.logoContainer}>
            <View style={styles.iconContainer}>
              <Handshake size={40} color="#fff" />
            </View>
            <Text style={styles.appName}>BringIt</Text>
          </View>

          {/* Card for Login/Register */}
          <View style={styles.card}>
            <Text style={styles.title}>Welcome to BringIt</Text>
            
            {/* Input Fields */}
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Username</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Username"
                  keyboardType="default"
                  value={username}
                  onChangeText={setUsername}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <PasswordInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                />
              </View>

              {/* Error Message */}
              {errorMessage ? (
                <Text style={styles.errorText}>{errorMessage}</Text>
              ) : null}

              <TouchableOpacity 
                style={styles.button} 
                onPress={handleLogin}
              >
                <Text style={styles.buttonText}>Login</Text>
              </TouchableOpacity>

              <Text style={styles.registerText}>
                Don’t have an account?{' '}
                <Text 
                  style={styles.registerLink} 
                  onPress={() => navigation.navigate('Register')}
                >
                  Register here
                </Text>
              </Text>
            </View>
          </View>

          {/* Footer */}
          <Text style={styles.footer}>© 2025 BringIt. All rights reserved.</Text>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EBEBEB",
  },
  inner: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 32,
  },
  iconContainer: {
    backgroundColor: "#5FC9C9",
    padding: 12,
    borderRadius: 50,
    marginRight: 12,
  },
  appName: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#2A4D4D",
  },
  card: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#FFFFFF",
    padding: 24,
    borderRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#2A4D4D",
    textAlign: "center",
    marginBottom: 16,
  },
  form: {
    marginTop: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#4A7070",
  },
  input: {
    height: 48,
    borderColor: "#5FC9C9",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    marginTop: 8,
  },
  button: {
    backgroundColor: "#5FC9C9",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  registerText: {
    textAlign: "center",
    fontSize: 14,
    color: "#4A7070",
    marginTop: 16,
  },
  registerLink: {
    color: "#5FC9C9",
    fontWeight: "600",
  },
  footer: {
    marginTop: 32,
    fontSize: 12,
    color: "#4A7070",
  },
  errorText: {
    color: "red",
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
  },
});

export default LoginScreen;
