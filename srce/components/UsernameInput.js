import React from "react";
import { TextInput, StyleSheet, View, Platform } from "react-native";

const UsernameInput = ({
  value,
  onChangeText,
  placeholder,
  onSubmitEditing,
  onBlur,
  editable = true,
  style,
  textContentType,
  autoComplete,
  returnKeyType = "next",
  ...props
}) => {
  return (
    <View style={styles.container}>
      <TextInput
        style={[styles.input, style]}
        placeholder={placeholder}
        placeholderTextColor="#999"
        value={value ?? ""}
        onChangeText={(text) => onChangeText?.(text ?? "")}
        onSubmitEditing={onSubmitEditing}
        onBlur={onBlur}
        editable={editable}
        keyboardType="default"
        autoCapitalize="none"
        autoCorrect={false}
        spellCheck={false}
        textContentType={
          textContentType ?? (Platform.OS === "ios" ? "username" : undefined)
        }
        autoComplete={
          autoComplete ?? (Platform.OS === "android" ? "username" : undefined)
        }
        returnKeyType={returnKeyType}
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
    color: "#000",
  },
});

export default UsernameInput;