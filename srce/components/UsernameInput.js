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
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 16,
    backgroundColor: "#fff",
    color: "#000",
  },
});

export default UsernameInput;