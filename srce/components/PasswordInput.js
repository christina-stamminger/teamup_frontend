import React, { useState, useCallback } from "react";
import { TextInput, View, Pressable, StyleSheet } from "react-native";
import { Eye, EyeOff } from "lucide-react-native";

const PasswordInput = ({
  value,
  onChangeText,
  placeholder = "Passwort",
  style,
  textContentType = "newPassword",
  autoComplete = "new-password",
  passwordRules = "minlength: 8; required: lower; required: upper; required: digit; required: special;",
  onBlur,
  ...props
}) => {
  const [secure, setSecure] = useState(true);
  const [isFocused, setIsFocused] = useState(false);

  const handleChangeText = useCallback(
    (text) => {
      // ✅ Passwort niemals automatisch verändern
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
        secureTextEntry={secure}
        onChangeText={handleChangeText}
        autoCapitalize="none"
        autoCorrect={false}
        textContentType={textContentType}
        autoComplete={autoComplete}
        passwordRules={passwordRules}
        onFocus={() => setIsFocused(true)}
        onBlur={(e) => {
          setIsFocused(false);
          onBlur?.(e);
        }}
        enablesReturnKeyAutomatically
        {...props}
      />

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