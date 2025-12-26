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

  const toggleSecure = useCallback(() => {
    setSecure(prev => !prev);

    // ✅ RN Bugfix: trailing space entfernen
    if (typeof value === "string") {
      const cleaned = value.replace(/\s+$/, "");
      if (cleaned !== value) {
        onChangeText(cleaned);
      }
    }
  }, [value, onChangeText]);

  return (
    <View style={styles.container}>
      <TextInput
        {...props}
        style={[styles.input, style]}
        value={value}
        placeholder={placeholder}
        secureTextEntry={secure}
        onChangeText={onChangeText}
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="password"
        importantForAutofill="no"
      />

      <TouchableOpacity
        onPress={toggleSecure}
        hitSlop={12}
        activeOpacity={0.7}
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
    borderWidth: 1,
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
});

export default PasswordInput;
