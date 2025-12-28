import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Alert, StyleSheet, TouchableOpacity } from 'react-native';
import Modal from 'react-native-modal';
import * as SecureStore from 'expo-secure-store';
import Constants from "expo-constants";

import { useNetwork } from '../components/context/NetworkContext';
import { useUser } from "../components/context/UserContext";

const API_URL = Constants.expoConfig.extra.API_URL;

export default function AddMemberModal({
  isVisible = false,
  onClose,
  groupId,
  onMemberAdded,
}) {
  const [username, setUsername] = useState('');
  const { safeFetch } = useNetwork();
  const { triggerGroupReload, accessToken } = useUser();

  // 🟢 NIEMALS undefined callbacks
  const safeClose = onClose ?? (() => { });
  const safeMemberAdded = onMemberAdded ?? (() => { });

  // 🟢 Beim Logout sofort resetten
  useEffect(() => {
    if (!accessToken) {
      setUsername('');
    }
  }, [accessToken]);

  const handleAddMember = async () => {
    if (!username.trim()) {
      Alert.alert('Fehler', 'Bitte gib einen Benutzernamen ein.');
      return;
    }

    try {
      const token = await SecureStore.getItemAsync('accessToken');
      if (!token) return; // Logout-Schutz

      const response = await safeFetch(`${API_URL}/api/groups/addUser`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username.trim(),
          groupId,
          role: 'MEMBER',
        }),
      });

      if (response.offline) {
        Alert.alert('Offline', 'Keine Internetverbindung.');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData?.message || 'Mitglied konnte nicht hinzugefügt werden'
        );
      }

      Alert.alert('Erfolg', `${username} wurde zur Gruppe hinzugefügt.`);
      setUsername('');
      triggerGroupReload();
      safeClose();
      safeMemberAdded();
    } catch (error) {
      console.error('Fehler beim Hinzufügen des Mitglieds:', error);
      Alert.alert(
        'Fehler',
        error.message ||
        'Mitglied konnte nicht hinzugefügt werden. Bitte überprüfe den Benutzernamen.'
      );
    }
  };

  // 🟢 Modal NIE rendern, wenn ausgeloggt
  if (!accessToken) {
    return null;
  }

  return (
    <Modal
      isVisible={!!isVisible}
      onBackdropPress={safeClose}
      onBackButtonPress={safeClose}
      avoidKeyboard
    >
      <View style={styles.modalContent}>
        <Text style={styles.title}>Mitglied per Benutzername hinzufügen</Text>

        <TextInput
          placeholder="Benutzername eingeben"
          placeholderTextColor="#aaa"
          value={username}
          onChangeText={setUsername}
          style={styles.input}
        />

        <TouchableOpacity
          style={styles.addMemberButton}
          onPress={handleAddMember}
        >
          <Text style={styles.addMemberText}>Mitglied hinzufügen</Text>
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
    fontSize: 16,
  },
  addMemberButton: {
    backgroundColor: '#5FC9C9',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
    elevation: 2,
  },
  addMemberText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});