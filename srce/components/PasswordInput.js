import React, { useState, useCallback } from "react";
import { TextInput, View, Pressable, StyleSheet, Platform } from "react-native";
import { Eye, EyeOff } from "lucide-react-native";

const PasswordInput = ({
  value,
  onChangeText,
  placeholder = "Passwort",
  style,
  onBlur,
  textContentType,
  autoComplete,
  passwordRules,
  allowToggle = true,
  ...props
}) => {
  const [secure, setSecure] = useState(true);

  const handleChangeText = useCallback(
  (text) => {
    onChangeText?.(text);
  },
  [onChangeText]
);

const handleEndEditing = useCallback(
  (e) => {
    const text = e.nativeEvent.text;
    onChangeText?.(text);
  },
  [onChangeText]
);

  const toggleSecure = useCallback(() => {
    setSecure((prev) => !prev);
  }, []);

  return (
    <View style={styles.container}>
      <TextInput
        style={[styles.input, style]}
        value={value}
        placeholder={placeholder}
        placeholderTextColor="#999"
        secureTextEntry={secure}
        onChangeText={handleChangeText}
        onEndEditing={handleEndEditing}   // 👈 DAS ist neu!
        autoCapitalize="none"
        autoCorrect={false}
        textContentType={textContentType}
        autoComplete={autoComplete}
        passwordRules={Platform.OS === "ios" ? passwordRules : undefined}
        onBlur={onBlur}
        enablesReturnKeyAutomatically
        {...props}
      />

      {allowToggle && (
        <Pressable
          onPress={toggleSecure}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.eyeButton}
          accessibilityRole="button"
          accessibilityLabel={secure ? "Passwort anzeigen" : "Passwort verbergen"}
        >
          {secure ? (
            <Eye size={22} color="#666" />
          ) : (
            <EyeOff size={22} color="#666" />
          )}
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
    backgroundColor: "#fff",
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#000",
  },
  eyeButton: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default PasswordInput;