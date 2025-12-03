import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import Modal from 'react-native-modal';
import * as SecureStore from 'expo-secure-store';
import Constants from "expo-constants";

const API_URL = Constants.expoConfig.extra.API_URL;

export default function GroupCreationModal({
  isVisible,
  toggleModal,
  userId,
  onGroupCreated,
}) {
  const [groupName, setGroupName] = useState('');
  // const [description, setDescription] = useState(''); // ⚠️ Auskommentiert für Release - später evtl. wieder aktivieren
  const [loading, setLoading] = useState(false);

  const handleCreateGroup = async () => {
    // ✅ Nur Gruppenname ist required, Beschreibung optional
    if (!groupName.trim()) {
      Alert.alert('Error', 'Please enter a group name.');
      return;
    }

    setLoading(true);
    try {
      const token = await SecureStore.getItemAsync('accessToken');
      const response = await fetch(`${API_URL}/api/groups/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          groupName: groupName.trim(),
          // description: description.trim() || null, // ⚠️ Auskommentiert für Release
          userId: userId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const message = data?.error || 'Failed to create group';
        throw new Error(message);
      }

      console.log('Group created:', data);

      if (onGroupCreated) {
        onGroupCreated(data);
      }

      setGroupName('');
      // setDescription(''); // ⚠️ Auskommentiert für Release
      toggleModal();
    } catch (error) {
      console.error('Error creating group:', error);
      Alert.alert('Error', error.message);
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
        {/* ⚠️ Beschreibung auskommentiert für Release - später evtl. wieder aktivieren
        <TextInput
          style={styles.input}
          placeholder="Beschreibung eingeben (optional)"
          placeholderTextColor="#aaa"
          value={description}
          onChangeText={setDescription}
          multiline
        />
        */}
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