import React, { useState, useCallback } from "react";
import { TextInput, View, TouchableOpacity, StyleSheet } from "react-native";
import { Eye, EyeOff } from "lucide-react-native";

const PasswordInput = ({
  value,
  onChangeText,
  placeholder = "Passwort",
  style,
  ...props
}) => {
  const [secure, setSecure] = useState(true);
  const [isFocused, setIsFocused] = useState(false);

  const handleChangeText = useCallback(
    (text) => {
      // RN Bugfix: trailing whitespace entfernen
      const cleaned = text.replace(/\s+$/, "");
      onChangeText(cleaned);
    },
    [onChangeText]
  );
  const toggleSecure = useCallback(() => {
    setSecure(prev => !prev);
  }, []);

  return (
    <View style={styles.container}>
      <TextInput
        style={[styles.input, style]}
        value={value}
        placeholder={isFocused ? "" : placeholder}
        secureTextEntry={secure}
        onChangeText={handleChangeText}
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="password"
        importantForAutofill="no"
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        {...props}
      />

      <TouchableOpacity
        onPress={toggleSecure}
        activeOpacity={0.7}
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
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: "#ccc",
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
    padding: 6,              
    justifyContent: "center",
    alignItems: "center",
  },
})

export default PasswordInput;
