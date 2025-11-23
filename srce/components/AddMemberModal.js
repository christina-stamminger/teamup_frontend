import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet, TouchableOpacity } from 'react-native';
import Modal from 'react-native-modal';
import * as SecureStore from 'expo-secure-store';

export default function AddMemberModal({ isVisible, onClose, groupId, onMemberAdded }) {
  const [username, setUsername] = useState('');

  const handleAddMember = async () => {
    try {
      const token = await SecureStore.getItemAsync('accessToken');

      const response = await fetch('http://192.168.50.116:8082/api/groups/addUser', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username,
          groupId: groupId,
          role: 'MEMBER',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add member');
      }

      Alert.alert('Success', `${username} was added to the group.`);
      setUsername('');
      onClose();
      onMemberAdded();  // 👈 Trigger re-fetch of members

    } catch (error) {
      console.error('Error adding member:', error);
      Alert.alert('Error', 'Could not add member. Please check the username.');
    }
  };

  return (
    <Modal isVisible={isVisible} onBackdropPress={onClose}>
      <View style={styles.modalContent}>
        <Text style={styles.title}>Add Member by Username</Text>
        <TextInput
          placeholder="Enter username"
          value={username}
          onChangeText={setUsername}
          style={styles.input}
        />

        <TouchableOpacity
          style={styles.addMemberButton}
          onPress={() => {
            handleAddMember(); // Your custom function
            // Alert.alert("Member added");
          }}
        >
          <Text style={styles.addMemberText}>Add Member</Text>
        </TouchableOpacity>


      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
  },
  addMemberButton: {
    backgroundColor: '#5FC9C9',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
    elevation: 2, // Android
  },
  addMemberText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
