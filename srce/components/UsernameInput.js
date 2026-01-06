import React from "react";
import { TextInput, StyleSheet, View } from "react-native";

const UsernameInput = ({ value, onChangeText, placeholder, onSubmitEditing }) => {
  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        keyboardType="default"
        value={value}
        onChangeText={onChangeText}
        autoCapitalize="none"
        autoCorrect={false}
        onFocus={() => console.log("USERNAME got focus")}
        onBlur={() => console.log("USERNAME lost focus")}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  input: {
    borderWidth: 0.5,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
});

export default UsernameInput;
