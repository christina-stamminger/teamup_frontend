import React from "react";
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from "react-native";
import Modal from "react-native-modal";

const groups = ["Family", "Office", "Friends"];

export default function GroupModal({ isVisible, toggleModal, selectedGroup, handleGroupSelect }) {
  return (
    <Modal isVisible={isVisible} onBackdropPress={toggleModal}>
      <View style={styles.modalContent}>
        <Text style={styles.selectedGroupText}>Selected Group: {selectedGroup}</Text>
        <FlatList
          data={groups}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.groupItem} onPress={() => handleGroupSelect(item)}>
              <Text style={styles.groupItemText}>{item}</Text>
            </TouchableOpacity>
          )}
        />
        <TouchableOpacity style={styles.joinGroupButton} onPress={() => alert("Feature coming soon!")}>
          <Text style={styles.joinGroupText}>+ Join New Group</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContent: { backgroundColor: "white", padding: 20, borderRadius: 10, alignItems: "center" },
  selectedGroupText: { fontSize: 18, fontWeight: "bold", marginBottom: 20, color: "#333" },
  groupItem: { padding: 10, fontSize: 18 },
  groupItemText: { fontSize: 16, color: "#333" },
  joinGroupButton: { marginTop: 20, padding: 10, backgroundColor: "#5FC9C9", borderRadius: 8, alignItems: "center" },
  joinGroupText: { color: "white", fontSize: 16 },
});
