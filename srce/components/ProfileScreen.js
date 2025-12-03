import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Alert,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import Modal from 'react-native-modal';
import { useNavigation } from '@react-navigation/native';
import { useUser } from './context/UserContext';
import { useNetwork } from '../components/context/NetworkContext';
import * as SecureStore from 'expo-secure-store';
import Constants from "expo-constants";

const API_URL = Constants.expoConfig.extra.API_URL;

const ProfileScreen = () => {
  const { userId, accessToken, loading: userContextLoading, logout } = useUser();
  const { safeFetch } = useNetwork();
  const navigation = useNavigation();

  const [userDetails, setUserDetails] = useState({
    username: '',
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    email: '',
    password: '********',
    address: {
      streetNumber: '',
      postalCode: '',
      city: '',
    },
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (userContextLoading) return;
    if (!accessToken || !userId) {
      Alert.alert('Fehler', 'Sitzungsdaten fehlen. Bitte erneut einloggen.');
      return;
    }
    fetchUserProfile();
  }, [userContextLoading, userId, accessToken]);

  // ✅ Profil abrufen
  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await safeFetch(
        `${API_URL}/api/users/profile/${userId}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.offline) {
        Alert.alert('Offline', 'Keine Internetverbindung.');
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setUserDetails({
          username: data.username,
          firstName: data.firstName,
          lastName: data.lastName,
          dateOfBirth: data.dateOfBirth,
          email: data.email,
          password: '********',
          address: {
            streetNumber: data.address?.streetNumber || '',
            postalCode: data.address?.postalCode || '',
            city: data.address?.city || '',
          },
        });
      } else {
        Alert.alert('Fehler', 'Profil konnte nicht geladen werden.');
      }
    } catch (error) {
      console.error('Fehler beim Abrufen des Profils:', error);
      Alert.alert('Fehler', 'Beim Laden deines Profils ist ein Problem aufgetreten.');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Änderungen speichern
  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await safeFetch(`${API_URL}/api/user`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          firstName: userDetails.firstName,
          lastName: userDetails.lastName,
          dateOfBirth: userDetails.dateOfBirth,
          address: {
            streetNumber: userDetails.address.streetNumber,
            postalCode: userDetails.address.postalCode,
            city: userDetails.address.city,
          },
        }),
      });

      if (response.offline) {
        Alert.alert('Offline', 'Keine Internetverbindung.');
        return;
      }

      if (response.ok) {
        Alert.alert('Erfolg', 'Profil erfolgreich gespeichert.');
      } else {
        const errData = await response.json();
        const msg = errData.errors?.join('\n') || 'Profil konnte nicht gespeichert werden.';
        Alert.alert('Fehler', msg);
      }
    } catch (error) {
      console.error('Fehler beim Speichern des Profils:', error);
      Alert.alert('Fehler', 'Beim Speichern deines Profils ist ein Problem aufgetreten.');
    } finally {
      setSaving(false);
    }
  };

  // ✅ Accountlösch-Check
  const handleCheckAccountDeletion = async () => {
    try {
      const response = await safeFetch(
        `${API_URL}/api/user/${userId}/canDelete`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (response.offline) {
        Alert.alert('Offline', 'Keine Internetverbindung.');
        return;
      }

      if (!response.ok) throw new Error('Fehler beim Prüfen des Accountstatus');
      const data = await response.json();

      if (!data.canDelete) {
        Alert.alert(
          'Account kann nicht gelöscht werden',
          data.reason ||
          'Du bist noch Admin einer Gruppe oder hast To-Dos in Arbeit.'
        );
        return;
      }

      Alert.alert(
        'Account wirklich löschen?',
        'Offene To-Dos werden gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.',
        [
          { text: 'Abbrechen', style: 'cancel' },
          { text: 'Löschen', style: 'destructive', onPress: handleDeleteAccount },
        ]
      );
    } catch (error) {
      console.error('Fehler beim Prüfen der Accountlöschung:', error);
      Alert.alert('Fehler', 'Konnte Accountstatus nicht prüfen.');
    }
  };

  // ✅ Account löschen
  const handleDeleteAccount = async () => {
    try {
      const response = await safeFetch(
        `${API_URL}/api/user/${userId}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (response.offline) {
        Alert.alert('Offline', 'Keine Internetverbindung.');
        return;
      }

      if (!response.ok) throw new Error('Fehler beim Löschen des Accounts');

      Alert.alert('Account gelöscht', 'Dein Account wurde erfolgreich gelöscht.');

      await SecureStore.deleteItemAsync("authToken");
      logout();
    } catch (error) {
      console.error('Fehler beim Löschen des Accounts:', error);
      Alert.alert('Fehler', 'Account konnte nicht gelöscht werden.');
    }
  };

  if (loading || userContextLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5FC9C9" />
        <Text style={{ marginTop: 10 }}>Profil wird geladen...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollViewContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          <Text style={styles.header}>Benutzerprofil</Text>

          <View style={styles.infoContainer}>
            {/* 🔒 READ-ONLY Felder */}
            <LabelValue label="Benutzername" value={userDetails.username} />
            <LabelValue label="E-Mail" value={userDetails.email} />
            <LabelValue label="Passwort" value={userDetails.password} />

            {/* ✏️ EDITIERBARE Felder */}
            <Text style={styles.label}>Vorname:</Text>
            <TextInput
              style={styles.input}
              value={userDetails.firstName}
              onChangeText={(val) =>
                setUserDetails((prev) => ({ ...prev, firstName: val }))
              }
              editable={!saving}
            />

            <Text style={styles.label}>Nachname:</Text>
            <TextInput
              style={styles.input}
              value={userDetails.lastName}
              onChangeText={(val) =>
                setUserDetails((prev) => ({ ...prev, lastName: val }))
              }
              editable={!saving}
            />

            <Text style={styles.label}>Geburtsdatum (YYYY-MM-DD):</Text>
            <TextInput
              style={styles.input}
              value={userDetails.dateOfBirth}
              onChangeText={(val) =>
                setUserDetails((prev) => ({ ...prev, dateOfBirth: val }))
              }
              editable={!saving}
              placeholder="1990-01-31"
            />

            <Text style={styles.label}>Straße und Hausnummer:</Text>
            <TextInput
              style={styles.input}
              value={userDetails.address.streetNumber}
              onChangeText={(val) =>
                setUserDetails((prev) => ({
                  ...prev,
                  address: { ...prev.address, streetNumber: val },
                }))
              }
              editable={!saving}
            />

            <Text style={styles.label}>Postleitzahl:</Text>
            <TextInput
              style={styles.input}
              value={userDetails.address.postalCode}
              onChangeText={(val) =>
                setUserDetails((prev) => ({
                  ...prev,
                  address: { ...prev.address, postalCode: val },
                }))
              }
              editable={!saving}
              keyboardType="numeric"
            />

            <Text style={styles.label}>Stadt:</Text>
            <TextInput
              style={styles.input}
              value={userDetails.address.city}
              onChangeText={(val) =>
                setUserDetails((prev) => ({
                  ...prev,
                  address: { ...prev.address, city: val },
                }))
              }
              editable={!saving}
            />
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.saveButton, saving && styles.disabledButton]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Profil speichern</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              disabled={saving}
            >
              <Text style={styles.backButtonText}>Zurück</Text>
            </TouchableOpacity>
          </View>

          {/* 🔴 Danger Zone */}
          <View style={styles.dangerZone}>
            <Text style={styles.dangerTitle}>Account löschen</Text>
            <Text style={styles.dangerDescription}>
              Du kannst deinen Account nur löschen, wenn du keine Adminrolle in Gruppen mehr hast
              und keine To-Dos in Arbeit sind. Offene To-Dos werden automatisch entfernt.
            </Text>

            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleCheckAccountDeletion}
            >
              <Text style={styles.deleteButtonText}>Account löschen</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const LabelValue = ({ label, value }) => (
  <>
    <Text style={styles.label}>{label}:</Text>
    <Text style={styles.value}>{value}</Text>
  </>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  scrollViewContainer: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    fontSize: 26,
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  infoContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginTop: 10,
  },
  value: {
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  buttonContainer: {
    marginTop: 20,
  },
  saveButton: {
    backgroundColor: '#5FC9C9',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  disabledButton: {
    backgroundColor: '#aaa',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    backgroundColor: '#ccc',
   
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  backButtonText: {
 color: '#fff',
     fontSize: 16,
    fontWeight: 'bold',
  },
  dangerZone: {
    marginTop: 40,
    padding: 15,
    backgroundColor: '#ffe6e6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffcccc',
  },
  dangerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#d9534f',
    marginBottom: 10,
  },
  dangerDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  deleteButton: {
    backgroundColor: '#d9534f',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProfileScreen;