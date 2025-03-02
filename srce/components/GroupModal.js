import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import Modal from 'react-native-modal';

export default function GroupModal({ isVisible, toggleModal, selectedGroup, handleGroupSelect, groups }) {
  return (
    <Modal isVisible={isVisible} onBackdropPress={toggleModal}>
      <View style={styles.modalContent}>
        <Text style={styles.selectedGroupText}>Selected Group: {selectedGroup}</Text>
        <FlatList
          data={groups}
          keyExtractor={(item) => item.groupId.toString()} // Use the groupId as the key
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.groupItem} onPress={() => handleGroupSelect(item.groupName)}>
              <Text style={styles.groupItemText}>{item.groupName}</Text>
            </TouchableOpacity>
          )}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContent: { backgroundColor: 'white', padding: 20, borderRadius: 10, alignItems: 'center' },
  selectedGroupText: { fontSize: 18, fontWeight: 'bold', marginBottom: 20, color: '#333' },
  groupItem: { padding: 10, fontSize: 18 },
  groupItemText: { fontSize: 16, color: '#333' },
});
