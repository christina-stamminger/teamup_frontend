import React from "react";
import { TextInput, StyleSheet, View } from "react-native";

const UsernameInput = React.forwardRef(
  (
    {
      value,
      onChangeText,
      placeholder,
      onSubmitEditing,
      onBlur,
      editable = true,
      style,
      returnKeyType = "next",
      ...props
    },
    ref
  ) => {
    return (
      <View style={styles.container}>
        <TextInput
          ref={ref}
          style={[styles.input, style]}
          placeholder={placeholder}
          placeholderTextColor="#999"
          value={value ?? ""}
          onChangeText={onChangeText}
          onSubmitEditing={onSubmitEditing}
          onBlur={onBlur}
          editable={editable}
          keyboardType="default"
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
          returnKeyType={returnKeyType}
          {...props}
        />
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  input: {
    height: 52,
    borderRadius: 14,
    paddingHorizontal: 14,
    fontSize: 16,
    backgroundColor: "#FFFFFF",
    color: "#12151A",
    borderWidth: 1,
    borderColor: "#EAECF0",
  },
});

export default UsernameInput;