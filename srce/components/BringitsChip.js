// components/BringitsChip.js
import React from "react";
import { TouchableOpacity, Text, StyleSheet, View } from "react-native";
import { Icons } from "../ui/icons";


export default function BringitsChip({
  value = 0,
  onPress,
  Icon = Icons.Handshake,
}) {
  const BringitsIcon = Icon;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={styles.container}
    >
      <View style={styles.inner}>
        <BringitsIcon size={15} color="#E8A94A" />
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
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#FEF6E9",
    borderWidth: 1,
    borderColor: "#F6E5C4",
  },
  text: {
    marginLeft: 5,
    fontSize: 13,
    fontWeight: "700",
    color: "#B7791F",
  },
});