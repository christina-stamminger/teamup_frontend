import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useUser } from "../components/context/UserContext";
import { useGroups } from "../components/context/GroupContext";
import { useNetwork } from "../components/context/NetworkContext";
import { API_URL } from "../config/env";

export default function GroupCreationModal({
  isVisible = false,
  onClose,
  onGroupCreated,
}) {
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(false);

  const { accessToken } = useUser();
  const { refreshGroups, setSelectedGroupId } = useGroups();
  const { safeFetch } = useNetwork();

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
      if (!token) return;

      const trimmedName = groupName.trim();

      const response = await safeFetch(`${API_URL}/api/groups/create`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          groupName: trimmedName,
        }),
      });

      if (response?.offline) {
        Alert.alert("Offline", "Keine Internetverbindung.");
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Failed to create group');
      }

      console.log("createGroup response:", data);

      onGroupCreated?.(data);

      const result = await refreshGroups();

      if (data?.groupId) {
        setSelectedGroupId(data.groupId);
      } else if (result?.groups?.length) {
        const created = result.groups.find((g) => g.label === trimmedName);
        if (created) {
          setSelectedGroupId(created.value);
        }
      }

      setGroupName('');
      onClose?.();

    } catch (error) {
      console.error('Error creating group:', error);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

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
        <TouchableWithoutFeedback
          onPress={() => {
            Keyboard.dismiss();
            onClose?.();
          }}
          accessible={false}
        >
          <View style={styles.overlay}>
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
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: 'center',
    width: '100%',
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