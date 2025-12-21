// components/BringitsChip.js
import React from "react";
import { TouchableOpacity, Text, StyleSheet, View } from "react-native";
import { Icons } from "../ui/icons";

export default function BringitsChip({
  value = 0,
  onPress,
  Icon = Icons.Star,
}) {
  const BringitsIcon = Icon;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={styles.container}
    >
      <View style={styles.inner}>
        <BringitsIcon size={16} />
        <Text style={styles.text}>{value}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginRight: 8,
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#F2F2F2", // neutral, iOS & Android
  },
  text: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: "600",
    color: "#222",
  },
});
