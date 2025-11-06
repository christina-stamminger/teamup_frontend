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

const ProfileScreen = () => {
  const { userId, token, loading: userContextLoading } = useUser();
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
    if (userContextLoading) return; // wait for user context to load

    if (!token || !userId) {
      Alert.alert('Error', 'Session data missing. Please log in again.');
      return;
    }

    fetchUserProfile();
    //fetchTrashedTodos(); // ✅ <--- hier hinzufügen

  }, [userContextLoading, userId, token]);


  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `http://192.168.50.116:8082/api/users/profile/${userId}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

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
        Alert.alert('Error', 'Failed to fetch user details.');
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      Alert.alert('Error', 'There was an issue fetching your profile.');
    } finally {
      setLoading(false);
    }
  };



  const handleSave = async () => {
    setSaving(true);

    try {
      const response = await fetch('http://192.168.50.116:8082/api/user', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          // Only sending address fields for now — add more if needed
          address: {
            streetNumber: userDetails.address.streetNumber,
            postalCode: userDetails.address.postalCode,
            city: userDetails.address.city,
          },
          // If you want to allow updating other fields, add them here
          // firstName: userDetails.firstName,
          // lastName: userDetails.lastName,
          // email: userDetails.email,
          // etc.
        }),
      });

      if (response.ok) {
        Alert.alert('Success', 'Profile saved successfully!');
      } else {
        const errData = await response.json();
        const msg = errData.errors?.join('\n') || 'Failed to save profile.';
        Alert.alert('Error', msg);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'There was an issue saving your profile.');
    } finally {
      setSaving(false);
    }
  };

  // Handle account deletion check
  const handleCheckAccountDeletion = async () => {
    try {
      const response = await fetch(
        `http://192.168.50.116:8082/api/user/${userId}/canDelete`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to check account status");
      const data = await response.json();

      if (!data.canDelete) {
        Alert.alert(
          "Account kann nicht gelöscht werden",
          data.reason ||
          "Du bist noch Admin einer Gruppe oder hast To-Dos in Arbeit."
        );
        return;
      }

      // ✅ Wenn alles passt → Bestätigungsmodal öffnen
      Alert.alert(
        "Account wirklich löschen?",
        "Offene To-Dos werden gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.",
        [
          { text: "Abbrechen", style: "cancel" },
          { text: "Löschen", style: "destructive", onPress: handleDeleteAccount },
        ]
      );
    } catch (error) {
      console.error("Error checking account deletion:", error);
      Alert.alert("Fehler", "Konnte Accountstatus nicht prüfen.");
    }
  };

  // Handle actual account deletion
  const handleDeleteAccount = async () => {
    try {
      const response = await fetch(
        `http://192.168.50.116:8082/api/user/${userId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error("Fehler beim Löschen des Accounts");

      Alert.alert("Account gelöscht", "Dein Account wurde erfolgreich gelöscht.");
      navigation.reset({
        index: 0,
        routes: [{ name: "Login" }],
      });
    } catch (error) {
      console.error("Error deleting account:", error);
      Alert.alert("Fehler", "Account konnte nicht gelöscht werden.");
    }
  };



  if (loading || userContextLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5FC9C9" />
        <Text style={{ marginTop: 10 }}>Loading profile...</Text>
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
          <Text style={styles.header}>User Profile</Text>

          <View style={styles.infoContainer}>
            <LabelValue label="Username" value={userDetails.username} />
            <LabelValue label="First Name" value={userDetails.firstName} />
            <LabelValue label="Last Name" value={userDetails.lastName} />
            <LabelValue label="Date of Birth" value={userDetails.dateOfBirth} />
            <LabelValue label="Email" value={userDetails.email} />
            <LabelValue label="Password" value={userDetails.password} />

            <Text style={styles.label}>Street and Number:</Text>
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

            <Text style={styles.label}>Postal Code:</Text>
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

            <Text style={styles.label}>City:</Text>
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
                <Text style={styles.saveButtonText}>Save Profile</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              disabled={saving}
            >
              <Text style={styles.backButtonText}>Back</Text>
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
  scrollViewContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 20,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    fontSize: 24,

    textAlign: 'center',
    marginBottom: 20,
  },
  infoContainer: {
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    marginTop: 10,
  },
  value: {
    fontSize: 16,
    marginBottom: 10,
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingLeft: 10,
    marginBottom: 10,
  },
  buttonContainer: {
    marginBottom: 10,
    marginTop: 20,
  },
  saveButton: {
    backgroundColor: '#5FC9C9',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10, //gap /margin between save and back button
  },
  disabledButton: {
    backgroundColor: '#a0d6d6',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    backgroundColor: '#e0e0e0',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dangerZone: {
    marginTop: 40,
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#f5c6cb",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dangerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#b71c1c",
    marginBottom: 8,
    textAlign: "center",
  },
  dangerDescription: {
    fontSize: 14,
    color: "#555",
    textAlign: "center",
    marginBottom: 16,
  },
  deleteButton: {
    backgroundColor: "#FF5C5C",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  deleteButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default ProfileScreen;
