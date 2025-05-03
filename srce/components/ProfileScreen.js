import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { useUser } from '../components/context/UserContext';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ProfileScreen = () => {
    // State to store user details
    const [userDetails, setUserDetails] = useState({
        username: '',
        firstName: '',
        lastName: '',
        dob: '',
        email: '',
        password: '********',
        address: {
            streetNumber: "",
            postalCode: "",
            city: "",
        },
    });

    // For loading state
    const [loading, setLoading] = useState(true);

    // Using Context to access userId, username, and JWT token
    const { userId, username, token } = useUser();

    // Navigation hook for handling back button
    const navigation = useNavigation();

    // Fetch user details when component mounts
    useEffect(() => {
        console.log("userId:", userId, "token:", token);

        const fetchUserProfile = async () => {
            try {
                setLoading(true);

                // Fetch user profile from the backend
                const response = await fetch(`http://192.168.50.116:8082/api/users/profile/${userId}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                // Check if the response is successful
                if (response.ok) {
                    const data = await response.json(); 
                    console.log("DATA", data)
                    setUserDetails({
                        username: data.username,
                        firstName: data.firstName,
                        lastName: data.lastName,
                        dob: data.dob,
                        email: data.email,
                        password: '********', // Mask password
                        address: {
                            streetNumber: data.address?.streetNumber || '', // Ensure safe access and fallback to empty string if not found
                            postalCode: data.address?.postalCode || '',  // Same for postalCode
                            street: data.address?.street || '', // If you have other fields like street, you can add them here
                            city: data.address?.city || '' // Example for city, adjust as needed
                        }
                    });
                } else {
                    Alert.alert('Error', 'Failed to fetch user details.');
                }
            } catch (error) {
                console.error("Error fetching user profile:", error);
                Alert.alert('Error', 'There was an issue fetching your profile.');
            } finally {
                setLoading(false);
            }
        };

        if (userId && token) {
            fetchUserProfile();
        }
    }, [userId, token]); // Re-fetch if userId or token changes

    // Function to handle updating the address
    const handleAddressChange = (newAddress) => {
        setUserDetails({ ...userDetails, address: newAddress });
    };

    // If loading, show a loading indicator
    if (loading) {
        return (
            <View style={styles.container}>
                <Text>Loading...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.safeAreaContainer}>
            <View style={styles.container}>
                <Text style={styles.header}>User Profile</Text>

                {/* Display User's Details */}
                <View style={styles.infoContainer}>

                    <Text style={styles.label}>Username:</Text>
                    <Text style={styles.value}>{userDetails.username}</Text>

                    <Text style={styles.label}>First Name:</Text>
                    <Text style={styles.value}>{userDetails.firstName}</Text>

                    <Text style={styles.label}>Last Name:</Text>
                    <Text style={styles.value}>{userDetails.lastName}</Text>

                    <Text style={styles.label}>Date of Birth:</Text>
                    <Text style={styles.value}>{userDetails.dob}</Text>


                    <Text style={styles.label}>Email:</Text>
                    <Text style={styles.value}>{userDetails.email}</Text>

                    <Text style={styles.label}>Password:</Text>
                    <Text style={styles.value}>{userDetails.password}</Text>

                    {/* Editable Address Fields */}
                    <Text style={styles.label}>Street and Number:</Text>
                    <TextInput
                        style={styles.input}
                        value={userDetails.address?.streetNumber} // Access the streetNumber from address
                        onChangeText={(newStreetNumber) => setUserDetails({
                            ...userDetails,
                            address: { ...userDetails.address, streetNumber: newStreetNumber } // Update only the streetNumber
                        })}
                    />

                

                    <Text style={styles.label}>Postal Code:</Text>
                    <TextInput
                        style={styles.input}
                        value={userDetails.address?.postalCode} // Access the postalCode from address
                        onChangeText={(newPostalCode) => setUserDetails({
                            ...userDetails,
                            address: { ...userDetails.address, postalCode: newPostalCode } // Update only the postalCode
                        })}
                    />

                    <Text style={styles.label}>City:</Text>
                    <TextInput
                        style={styles.input}
                        value={userDetails.address?.city} // Access the city from address
                        onChangeText={(newCity) => setUserDetails({
                            ...userDetails,
                            address: { ...userDetails.address, city: newCity } // Update only the city
                        })}
                    />

                </View>

                <View style={styles.buttonContainer}>
                    {/* Save Button */}
                    <Button title="Save Profile" onPress={() => Alert.alert("Profile saved")} />

                    {/* Back Button */}
                    <Button
                        title="Back"
                        onPress={() => navigation.navigate('HomeTabs', { screen: 'MyTodosScreen' })}
                    />
                </View>
            </View>
        </SafeAreaView>
    );
};

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
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        marginVertical: 5,
    },
    value: {
        fontSize: 16,
        marginBottom: 15,
    },
    input: {
        height: 40,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 5,
        paddingLeft: 10,
        marginBottom: 20,
    },
    buttonContainer: {
        marginTop: 5,
        gap: 5,
    }
});

export default ProfileScreen;
