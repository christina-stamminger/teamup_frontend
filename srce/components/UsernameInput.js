import React from "react";
import { TextInput, StyleSheet, View, Platform } from "react-native";

const UsernameInput = ({
  value,
  onChangeText,
  placeholder,
  onSubmitEditing,
  onBlur,
  editable = true,
  ...props
}) => {
  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#999"
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmitEditing}
        onBlur={onBlur}
        editable={editable}
        keyboardType="default"
        autoCapitalize="none"
        autoCorrect={false}
        textContentType={Platform.OS === "ios" ? "username" : undefined}
        autoComplete={Platform.OS === "android" ? "username" : undefined}
        returnKeyType="next"
        {...props}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  input: {
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 16,
    backgroundColor: "#fff",
  },
});

export default UsernameInput;