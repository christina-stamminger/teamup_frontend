import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Modal } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import Constants from "expo-constants";
import { useUser } from "../components/context/UserContext";

const API_URL = Constants.expoConfig.extra.API_URL;

export default function GroupCreationModal({
  isVisible = false,
  onClose,
  userId,
  onGroupCreated,
}) {
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(false);

  const { triggerGroupReload, accessToken } = useUser();

  // 🟢 SAFE callback (niemals undefined)
  const safeToggle = onClose ?? (() => { });

  // 🟢 Modal beim Logout sofort schließen
  useEffect(() => {
    if (!accessToken) {
      setGroupName('');
    }
  }, [accessToken]);

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert('Error', 'Please enter a group name.');
      return;
    }

    setLoading(true);
    try {
      const token = await SecureStore.getItemAsync('accessToken');
      if (!token) return; // Logout-Schutz

      const response = await fetch(`${API_URL}/api/groups/create`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          groupName: groupName.trim(),
          userId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Failed to create group');
      }

      onGroupCreated?.(data);
      triggerGroupReload();
      setGroupName('');
      safeToggle();
    } catch (error) {
      console.error('Error creating group:', error);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  // 🟢 WICHTIG: Modal gar nicht rendern, wenn ausgeloggt
  if (!accessToken) {
    return null;
  }

  return (
    <Modal
      visible={!!isVisible}
      transparent
      animationType="fade"
      onRequestClose={safeToggle}   // Android Back Button
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <TextInput
            style={styles.input}
            placeholder="Gruppenname eingeben"
            placeholderTextColor="#aaa"
            value={groupName}
            onChangeText={setGroupName}
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
      </View>
    </Modal>

  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    width: '80%', // optional, empfohlen
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
