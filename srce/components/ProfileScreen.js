import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Alert,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
//import { useUser } from '../components/context/UserContext';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
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

  useEffect(() => {
    if (userContextLoading) return; // wait for user context to load
    console.log(userContextLoading)
    if (!token || !userId) {
      console.warn(token, 'Token or userId missing after context load');
      Alert.alert('Error', 'Session data missing. Please log in again.');
      return;
    }

    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://192.168.50.116:8082/api/users/profile/${userId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

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

    fetchUserProfile();
  }, [userContextLoading, userId, token]);

  if (loading || userContextLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5FC9C9" />
        <Text style={{ marginTop: 10 }}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeAreaContainer}>
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
          />
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={() => Alert.alert('Profile saved')}
          >
            <Text style={styles.saveButtonText}>Save Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const LabelValue = ({ label, value }) => (
  <>
    <Text style={styles.label}>{label}:</Text>
    <Text style={styles.value}>{value}</Text>
  </>
);

const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
    backgroundColor: '#f4f4f9',
  },
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  infoContainer: {
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
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
    gap: 10,
    marginTop: 20,
  },
  saveButton: {
    backgroundColor: '#5FC9C9',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
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
    color: '#333',
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ProfileScreen;
