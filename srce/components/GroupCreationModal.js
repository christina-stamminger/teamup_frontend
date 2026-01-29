import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Modal, KeyboardAvoidingView} from 'react-native';
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
  //const safeToggle = onClose ?? (() => { });

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

      // ✅ 1. Parent informieren
      onGroupCreated?.(data);

      // ✅ 2. Lokalen State resetten
      setGroupName('');

      // ✅ 3. Modal EXPLIZIT schließen
      onClose();

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
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* BACKDROP */}
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.overlay}>

            {/* MODAL CONTENT */}
            <TouchableWithoutFeedback accessible={false}>
              <View style={styles.modalContent}>
                <Text style={styles.title}>Neue Gruppe erstellen</Text>

                <TextInput
                  style={styles.input}
                  placeholder="Gruppenname eingeben"
                  placeholderTextColor="#aaa"
                  value={groupName}
                  onChangeText={setGroupName}
                  autoFocus
                  returnKeyType="done"
                />

                <TouchableOpacity
                  style={[styles.createButton, loading && { opacity: 0.6 }]}
                  onPress={handleCreateGroup}
                  disabled={loading}
                >
                  <Text style={styles.createButtonText}>
                    {loading ? "Creating..." : "Gruppe erstellen"}
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>

          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContent: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    width: '85%',
  },
  title: {
    fontSize: 18,
    marginBottom: 16,
  },
  input: {
    width: '100%',
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#F2F4F7',
    marginBottom: 16,
    fontSize: 16,
  },
  createButton: {
    backgroundColor: '#4FB6B8',
    paddingVertical: 14,
    paddingHorizontal: 24,   // 👈 DAS fehlt aktuell
    borderRadius: 10,
    alignItems: 'center',
    width: '100%',           // optional, aber empfehlenswert
  },
  createButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});