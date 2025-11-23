import React, { useState } from "react";
import { TextInput, View, TouchableOpacity, StyleSheet } from "react-native";
import { Eye, EyeOff } from "lucide-react-native";

const PasswordInput = ({ value, onChangeText, placeholder, onSubmitEditing }) => {
  const [secure, setSecure] = useState(true);

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder={placeholder || "Enter password"}
        secureTextEntry={secure}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => console.log("PASSWORD got focus")}
        onBlur={() => console.log("PASSWORD lost focus")}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <TouchableOpacity onPress={() => setSecure(!secure)}>
        {secure ? <Eye size={24} color="gray" /> : <EyeOff size={24} color="gray" />}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    borderColor: "#ccc",
    paddingHorizontal: 12,
    height: 48,
    marginTop: 8,
    backgroundColor: "#fff",
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
});

export default PasswordInput;
