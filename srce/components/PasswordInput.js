import React, { useState } from "react";
import { TextInput, View, TouchableOpacity, StyleSheet } from "react-native";
import { Eye, EyeOff } from "lucide-react-native"; // Import icons

const PasswordInput = ({ value, onChangeText, placeholder }) => {
  const [secure, setSecure] = useState(true);

  return (
    <View style={styles.container}>
    <TextInput
      style={styles.input}
      placeholder={placeholder || "Enter password"} // Default placeholder
      secureTextEntry={secure}
      value={value} // Controlled input
      onChangeText={onChangeText} // Handle input changes
    />
    <TouchableOpacity onPress={() => setSecure(!secure)}>
      {secure ? <EyeOff size={24} color="gray" /> : <Eye size={24} color="gray" />}
    </TouchableOpacity>
  </View>
  );
};

const styles = StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: "#5FC9C9",
      borderRadius: 8,
      paddingHorizontal: 12, // Matches TextInput padding
      height: 48, // Ensure same height
      marginTop: 8, // Ensure same spacing as Username input
    },
    input: {
      flex: 1,
      fontSize: 16,
    },
  });
  

export default PasswordInput;
