import React, { useState, useCallback } from "react";
import { TextInput, View, Pressable, StyleSheet } from "react-native";
import { Eye, EyeOff } from "lucide-react-native";

const PasswordInput = React.forwardRef(
  (
    {
      value,
      onChangeText,
      placeholder = "Passwort",
      style,
      onBlur,
      allowToggle = true,
      ...props
    },
    ref
  ) => {
    const [secure, setSecure] = useState(true);

    const toggleSecure = useCallback(() => {
      setSecure((prev) => !prev);
    }, []);

    console.log(
      "🧩 [PasswordInput render] value:",
      value,
      "| length:",
      value?.length,
      "| secure:",
      secure
    );

    return (
      <View style={styles.container}>
        <TextInput
          ref={ref}
          style={[styles.input, style]}
          value={value ?? ""}
          placeholder={placeholder}
          placeholderTextColor="#999"
          secureTextEntry={secure}

          onChangeText={(text) => {
            console.log("🔐 [PasswordInput] onChangeText:", text, "| length:", text?.length);
            onChangeText?.(text);
          }}

          onBlur={(e) => {
            console.log("🔐 [PasswordInput] onBlur value:", e?.nativeEvent?.text);
            onBlur?.(e);
          }}

          onFocus={() => {
            console.log("🔐 [PasswordInput] onFocus");
          }}

          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
          enablesReturnKeyAutomatically
          {...props}
        />

        {allowToggle && (
          <Pressable
            onPress={toggleSecure}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={styles.eyeButton}
            accessibilityRole="button"
            accessibilityLabel={
              secure ? "Passwort anzeigen" : "Passwort verbergen"
            }
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
  }
);

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