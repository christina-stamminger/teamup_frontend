import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import Modal from 'react-native-modal';
import * as SecureStore from 'expo-secure-store';

export default function GroupCreationModal({
  isVisible,
  toggleModal,
  userId,
  onGroupCreated,
}) {
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateGroup = async () => {
    if (!groupName.trim() || !description.trim()) {
      Alert.alert('Error', 'Please enter both a group name and description.');
      return;
    }

    setLoading(true);
    try {
      const token = await SecureStore.getItemAsync('authToken');
      const response = await fetch('http://192.168.50.116:8082/api/groups/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          groupName: groupName.trim(),
          description: description.trim(),
          userId: userId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Spezifische Fehlermeldung vom Backend
        const message = data?.error || 'Failed to create group';
        throw new Error(message);
      }

      console.log('Group created:', data);

      if (onGroupCreated) {
        onGroupCreated(data);
      }

      setGroupName('');
      setDescription('');
      toggleModal();
    } catch (error) {
      console.error('Error creating group:', error); // Für Debugging in der Konsole
      Alert.alert('Error', error.message);           // Userfreundliche Meldung
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isVisible={isVisible} onBackdropPress={toggleModal}>
      <View style={styles.modalContent}>
        <TextInput
          style={styles.input}
          placeholder="Gruppenname eingeben"
          placeholderTextColor="#aaa"
          value={groupName}
          onChangeText={setGroupName}
        />
        <TextInput
          style={styles.input}
          placeholder="Beschreibung eingeben"
          placeholderTextColor="#aaa"
          value={description}
          onChangeText={setDescription}
          multiline
        />
        <TouchableOpacity
          style={[styles.createButton, loading && { opacity: 0.6 }]}
          onPress={handleCreateGroup}
          disabled={loading}
        >
          <Text style={styles.createButtonText}>
            {loading ? 'Creating...' : 'Gruppe erstellen'}
          </Text>
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
    alignItems: 'center',
  },
  input: {
    width: '100%',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 10,
    fontSize: 16,
  },
  createButton: {
    backgroundColor: '#5FC9C9',
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
    width: '100%',
  },
  createButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
