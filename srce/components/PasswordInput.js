import React, { useState, useCallback, useMemo } from "react";
import { TextInput, View, Pressable, StyleSheet, Platform } from "react-native";
import { Eye, EyeOff } from "lucide-react-native";

const PasswordInput = ({
  value,
  onChangeText,
  onBlur,
  placeholder = "Passwort",
  style,
  allowToggle = true,
  textContentType,
  autoComplete,
  passwordRules,
  returnKeyType = "done",
  editable = true,
  accessibilityLabel = "Passwort",
  ...props
}) => {
  const [secure, setSecure] = useState(true);

  const resolvedTextContentType = useMemo(() => {
    if (textContentType) return textContentType;
    return Platform.OS === "ios" ? "password" : undefined;
  }, [textContentType]);

  const resolvedAutoComplete = useMemo(() => {
    if (autoComplete) return autoComplete;
    return Platform.OS === "android" ? "password" : undefined;
  }, [autoComplete]);

  const handleChangeText = useCallback(
    (text) => {
      onChangeText?.(text ?? "");
    },
    [onChangeText]
  );

  const handleBlur = useCallback(
    (e) => {
      onBlur?.(e);
    },
    [onBlur]
  );

  const toggleSecure = useCallback(() => {
    setSecure((prev) => !prev);
  }, []);

  return (
    <View style={styles.container}>
      <TextInput
        style={[styles.input, style]}
        value={value ?? ""}
        placeholder={placeholder}
        placeholderTextColor="#999"
        secureTextEntry={secure}
        onChangeText={handleChangeText}
        onBlur={handleBlur}
        autoCapitalize="none"
        autoCorrect={false}
        spellCheck={false}
        importantForAutofill="yes"
        textContentType={resolvedTextContentType}
        autoComplete={resolvedAutoComplete}
        passwordRules={Platform.OS === "ios" ? passwordRules : undefined}
        enablesReturnKeyAutomatically
        keyboardType="default"
        returnKeyType={returnKeyType}
        editable={editable}
        accessibilityLabel={accessibilityLabel}
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
    paddingVertical: 0,
  },
  eyeButton: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
});

export default PasswordInput;