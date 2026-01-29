import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import * as SecureStore from "expo-secure-store";
import { API_URL } from "../../config/env";

const SetNewPasswordScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const [password, setPassword] = useState("");
  const [tokenLoaded, setTokenLoaded] = useState(false);
  const [token, setToken] = useState("");

  // Token aus Param speichern
  useEffect(() => {
    const storeToken = async () => {
      if (route.params?.token) {
        await SecureStore.setItemAsync("resetToken", route.params.token);
        setToken(route.params.token);
        setTokenLoaded(true);
      } else {
        const savedToken = await SecureStore.getItemAsync("resetToken");
        if (savedToken) {
          setToken(savedToken);
          setTokenLoaded(true);
        } else {
          Alert.alert("Fehler", "Kein Token gefunden.");
        }
      }
    };
    storeToken();
  }, [route.params]);

  const handleResetPassword = async () => {
    if (!password || password.length < 6) {
      Alert.alert("Fehler", "Passwort muss mindestens 6 Zeichen lang sein.");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/user/auth/set-new-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });

      if (response.ok) {
        await SecureStore.deleteItemAsync("resetToken"); // Token löschen
        Alert.alert("Erfolg", "Passwort erfolgreich geändert.");
        navigation.navigate("Login");
      } else {
        const data = await response.json();
        Alert.alert("Fehlgeschlagen", data.message || "Ungültiger oder abgelaufener Token.");
      }
    } catch (error) {
      console.error("Fehler beim Zurücksetzen:", error);
      Alert.alert("Netzwerkfehler", "Bitte versuch es später erneut.");
    }
  };

  if (!tokenLoaded) {
    return (
      <View style={styles.container}>
        <Text>Lade...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Neues Passwort eingeben:</Text>
      <TextInput
        style={styles.input}
        secureTextEntry
        placeholder="Neues Passwort"
        value={password}
        onChangeText={setPassword}
      />
      <Button title="Passwort zurücksetzen" onPress={handleResetPassword} />
    </View>
  );
};

export default SetNewPasswordScreen;

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20 },
  label: { fontSize: 18, marginBottom: 10 },
  input: {
    borderWidth: 1, borderColor: "#ccc", padding: 10,
    marginBottom: 20, borderRadius: 5,
  },
});
