import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    Keyboard,
    ScrollView,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useUser } from "../components/context/UserContext"; // Import the useUser hook

export default function CreateTodoScreen() {
    const [title, setTitle] = useState('');
    const [location, setLocation] = useState('');
    const [description, setDescription] = useState('');
    const [addInfo, setAddInfo] = useState('');
    const [uploadPath, setUploadPath] = useState('');
    const [expiresAt, setExpiresAt] = useState('');
    const [groupId, setGroupId] = useState(''); // New state for groupId
    const [groups, setGroups] = useState([]); // To store the available groups for the user

    const { userId } = useUser(); // Access the userId from context

    // Format date to match the backend format (YYYY-MM-DD HH:mm:ss)
    const formatLocalDateTime = (date) => {
        return date.toISOString().slice(0, 19); // Format as "YYYY-MM-DDTHH:mm:ss"  
    };

    // Fetch the groups the user is part of
    useEffect(() => {
        const fetchGroups = async () => {
            try {
                const token = await SecureStore.getItemAsync('authToken');
                const response = await fetch('http://192.168.50.116:8082/api/groups/myGroups', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch groups');
                }

                const data = await response.json();
                setGroups(data); // Populate the groups available to the user
            } catch (error) {
                console.error('Error fetching groups:', error);
                Alert.alert('Error', 'Failed to fetch groups. Please try again.');
            }
        };

        fetchGroups();
    }, []);

    const handleCreateTodo = async () => {
        if (!title || !description || !expiresAt || !groupId) {
            Alert.alert('Error', 'Title, Description, Expiration Date, and Group are required!');
            return;
        }

        // Format expiresAt date if it's provided in a valid format
        const formattedDateTime = expiresAt ? formatLocalDateTime(new Date(expiresAt)) : '';

        const newTodo = {
            userOfferedId: userId,  // The logged-in user ID
            title,
            location,
            description,
            addInfo,
            uploadPath,
            expiresAt: formattedDateTime, // Send formatted date to backend
            groupId,  // Include groupId in the payload
        };

        console.log("Sending JSON Payload:", JSON.stringify(newTodo)); // Debug log

        try {
            const token = await SecureStore.getItemAsync("authToken");

            const response = await fetch("http://192.168.50.116:8082/api/todo/create", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,  // Include token in the header
                },
                body: JSON.stringify(newTodo),
            });

            if (!response.ok) {
                console.log("response:", response);
                throw new Error("Failed to create todo!");
            }

            const data = await response.json();
            console.log("Todo Created:", data);

            Alert.alert("Success", "Todo Created Successfully!");

            // Optional: Reset form fields after submission
            setTitle("");
            setLocation("");
            setDescription("");
            setAddInfo("");
            setUploadPath("");
            setExpiresAt("");
            setGroupId(""); // Reset group selection
        } catch (error) {
            console.error("Error:", error);
            Alert.alert("Error", "Failed to create todo. Please try again.");
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.container}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <ScrollView 
                    contentContainerStyle={styles.scrollContainer}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.inner}>
                        <Text style={styles.label}>Title</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter todo title"
                            value={title}
                            onChangeText={setTitle}
                        />

                        <Text style={styles.label}>Location</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter location"
                            value={location}
                            onChangeText={setLocation}
                        />

                        <Text style={styles.label}>Description</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Enter todo description"
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                            value={description}
                            onChangeText={setDescription}
                        />

                        <Text style={styles.label}>Additional Info</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter additional info"
                            value={addInfo}
                            onChangeText={setAddInfo}
                        />

                        <Text style={styles.label}>Upload Path</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter upload path"
                            value={uploadPath}
                            onChangeText={setUploadPath}
                        />

                        <Text style={styles.label}>Expires At (YYYY-MM-DD HH:MM:SS)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter expiration date and time"
                            value={expiresAt}
                            onChangeText={setExpiresAt}
                        />

                        <Text style={styles.label}>Select Group</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter group ID"
                            value={groupId}
                            onChangeText={setGroupId}
                        />
                        {/* Alternatively, you could use a modal or picker for group selection */}
                        
                        <TouchableOpacity style={styles.button} onPress={handleCreateTodo}>
                            <Text style={styles.buttonText}>Create Todo</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F7F7F7',
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: "center",
    },
    inner: {
        padding: 16,
    },
    label: {
        fontSize: 16,
        marginVertical: 8,
    },
    input: {
        height: 48,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        paddingHorizontal: 12,
        justifyContent: 'center',
        marginBottom: 16,
        backgroundColor: '#FFF', // Better contrast
    },
    textArea: {
        height: 100,
        textAlignVertical: "top",
    },
    button: {
        backgroundColor: '#5FC9C9',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 20,
    },
    buttonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
});
