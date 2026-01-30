import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Alert, StyleSheet, TouchableOpacity, Modal, Pressable } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import Toast from 'react-native-toast-message';
import { useNetwork } from '../components/context/NetworkContext';
import { useUser } from "../components/context/UserContext";

import { API_URL, APP_ENV } from "../config/env";

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
      Toast.show({
        type: 'error',
        text1: 'Ungültige Eingabe',
        text2: 'Bitte gib einen Benutzernamen ein.',
      });
      return;
    }

    try {
      const token = await SecureStore.getItemAsync('accessToken');
      if (!token) return;

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

      if (response?.offline) {
        Toast.show({
          type: 'info',
          text1: 'Offline',
          text2: 'Keine Internetverbindung',
        });
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData?.message || 'Mitglied konnte nicht hinzugefügt werden'
        );
      }

      // ✅ SUCCESS
      Toast.show({
        type: 'success',
        text1: 'Mitglied hinzugefügt',
        text2: `${username} wurde zur Gruppe hinzugefügt.`,
      });

      setUsername('');
      triggerGroupReload();
      safeMemberAdded();

      // 🔥 Modal schließen → Toast sichtbar + User sieht Ergebnis
      safeClose();

    } catch (error) {
      console.error('Fehler beim Hinzufügen des Mitglieds:', error);

      Toast.show({
        type: 'error',
        text1: 'Mitglied konnte nicht hinzugefügt werden',
        text2: error.message || 'Unbekannter Fehler',
      });
    }
  };



  // 🟢 Modal NIE rendern, wenn ausgeloggt
  if (!accessToken) {
    return null;
  }

  return (
    <Modal
      visible={!!isVisible}
      transparent
      animationType="fade"
      onRequestClose={safeClose}   // Android Back Button
    >
      {/* ⬇️ Overlay schließt Modal */}
      <Pressable style={styles.overlay} onPress={safeClose}>

        {/* ⬇️ Modal-Inhalt blockiert Overlay-Taps */}
        <Pressable style={styles.modalContent} onPress={() => { }}>
          <Text style={styles.title}>Mitglied hinzufügen</Text>

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
        </Pressable>

      </Pressable>
    </Modal>

  )
}


const styles = StyleSheet.create({
  modalContent: {
    width: '85%',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
  },
  title: {
    fontSize: 18,
    marginBottom: 12,
  },
  input: {
    width: '100%',
    height: 52,          // 👈 macht das Feld sichtbar größer
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#F2F4F7',
    marginBottom: 20,
    fontSize: 16,
  },
  addMemberButton: {
    backgroundColor: '#4FB6B8',
    paddingVertical: 14,
    paddingHorizontal: 24,   //
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
    elevation: 2,
  },
  addMemberText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});