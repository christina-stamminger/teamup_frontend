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
import { useUser } from "../components/context/UserContext";  // Assuming useUser is a custom hook to get user data
import { Dropdown } from 'react-native-element-dropdown';
import { MaskedTextInput } from 'react-native-mask-text';

export default function CreateTodoScreen() {
    const [title, setTitle] = useState('');
    const [location, setLocation] = useState('');
    const [description, setDescription] = useState('');
    const [addInfo, setAddInfo] = useState('');
    const [uploadPath, setUploadPath] = useState('');
    const [expiresAt, setExpiresAt] = useState('');
    const [groupId, setGroupId] = useState(null);
    const [groups, setGroups] = useState([]);

    // Use the context to get the user ID
    const { userId } = useUser(); // Access userId directly from the context

    // Debug log for userId
    useEffect(() => {
        console.log("userId from context:", userId); // Check the value of userId
    }, [userId]);

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
                const formattedGroups = data.map((group) => ({
                    label: group.groupName,
                    value: group.groupId.toString(),
                }));
                setGroups(formattedGroups);
            } catch (error) {
                console.error('Error fetching groups:', error);
                Alert.alert('Error', 'Failed to fetch groups. Please try again.');
            }
        };

        fetchGroups();
    }, []);

    const handleCreateTodo = async () => {
        // Check if userId is null
        if (!userId) {
            Alert.alert('Error', 'User not logged in. Please log in again.');
            return;
        }

        console.log("Creating todo for userId:", userId); // Check the userId before creating the todo

        if (!title || !description || !expiresAt || !groupId) {
            Alert.alert('Error', 'Title, Description, Expiration Date, and Group are required!');
            return;
        }
        // Convert expiresAt from "YYYY-MM-DD HH:MM:SS" to "YYYY-MM-DDTHH:MM:SSZ"
        const formattedExpiresAt = expiresAt.replace(" ", "T") + "Z";

        const newTodo = {
            userOfferedId: userId,
            title,
            location,
            description,
            addInfo,
            uploadPath,
            expiresAt: formattedExpiresAt, // Corrected format
            groupId: parseInt(groupId, 10),
        };


        console.log("Sending JSON Payload:", JSON.stringify(newTodo)); // Log the newTodo object

        try {
            const token = await SecureStore.getItemAsync("authToken");

            const response = await fetch("http://192.168.50.116:8082/api/todo/create", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify(newTodo),
            });

            if (!response.ok) {
                throw new Error("Failed to create todo!");
            }

            const data = await response.json();
            console.log("Todo Created:", data); // Log the response data

            Alert.alert("Success", "Todo Created Successfully!");

            // Reset fields
            setTitle("");
            setLocation("");
            setDescription("");
            setAddInfo("");
            setUploadPath("");
            setExpiresAt("");
            setGroupId(null);
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
                        {/* Title */}
                        <Text style={styles.label}>Title</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter todo title"
                            value={title}
                            onChangeText={setTitle}
                        />

                        {/* Location */}
                        <Text style={styles.label}>Location</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter location"
                            value={location}
                            onChangeText={setLocation}
                        />

                        {/* Description */}
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

                        {/* Additional Info */}
                        <Text style={styles.label}>Additional Info</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter additional info"
                            value={addInfo}
                            onChangeText={setAddInfo}
                        />

                        {/* Upload Path */}
                        <Text style={styles.label}>Upload Path</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter upload path"
                            value={uploadPath}
                            onChangeText={setUploadPath}
                        />

                        {/* Expires At (Masked Input) */}
                        <Text style={styles.label}>Expires At (YYYY-MM-DD HH:MM:SS)</Text>
                        <MaskedTextInput
                            mask="9999-99-99 99:99:99"
                            style={styles.input}
                            placeholder="YYYY-MM-DD HH:MM:SS"
                            keyboardType="numeric"
                            value={expiresAt}
                            onChangeText={setExpiresAt}
                        />

                        {/* Group Selection */}
                        <Text style={styles.label}>Select Group</Text>
                        <Dropdown
                            style={styles.dropdown}
                            data={groups}
                            maxHeight={300}
                            labelField="label"
                            valueField="value"
                            placeholder="Select Group"
                            value={groupId}
                            onChange={(item) => setGroupId(item.value)}
                        />

                        {/* Create Button */}
                        <TouchableOpacity style={styles.button} onPress={handleCreateTodo}>
                            <Text style={styles.buttonText}>Create Todo</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
}

// Styles
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
        marginBottom: 16,
        backgroundColor: '#FFF',
    },
    textArea: {
        height: 100,
        textAlignVertical: "top",
    },
    dropdown: {
        height: 48,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        paddingHorizontal: 12,
        marginBottom: 16,
        backgroundColor: '#FFF',
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
