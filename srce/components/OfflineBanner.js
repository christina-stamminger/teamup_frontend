import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useNetwork } from "./context/NetworkContext";

export default function OfflineBanner() {
  const { isConnected } = useNetwork();

  if (isConnected) return null;

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>🔌 Keine Internetverbindung</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: "#FF6B6B",
    paddingVertical: 10,
    alignItems: "center",
  },
  text: {
    color: "#fff",
    fontWeight: "600",
  },
});
