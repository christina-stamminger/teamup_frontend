import React, { useState, useEffect, useCallback } from 'react';
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
import { useUser } from "../components/context/UserContext";
import { Dropdown } from 'react-native-element-dropdown';
import { MaskedTextInput } from 'react-native-mask-text';
import Toast from 'react-native-toast-message';
import { useFocusEffect } from '@react-navigation/native';
import { ChevronDown, ChevronUp } from 'lucide-react-native'; // ← Icons für Collapse
import DateTimePickerModal from 'react-native-modal-datetime-picker';

export default function CreateTodoScreen() {
    const [title, setTitle] = useState("");
    const [expiresAt, setExpiresAt] = useState("");
    const [groupId, setGroupId] = useState(null);
    const [groups, setGroups] = useState([]);

    const [description, setDescription] = useState("");
    const [showDescription, setShowDescription] = useState(false);

    // DateTime Picker state
    const [isDatePickerVisible, setDatePickerVisible] = useState(false);

    const { userId } = useUser();

    useEffect(() => {
        console.log("userId from context:", userId);
    }, [userId]);

    useFocusEffect(
        useCallback(() => {
            const fetchGroups = async () => {
                try {
                    const token = await SecureStore.getItemAsync("authToken");
                    const response = await fetch(
                        "http://192.168.50.116:8082/api/groups/myGroups",
                        {
                            method: "GET",
                            headers: {
                                Authorization: `Bearer ${token}`,
                                "Content-Type": "application/json",
                            },
                        }
                    );

                    if (!response.ok) {
                        throw new Error("Failed to fetch groups");
                    }

                    const data = await response.json();
                    const formattedGroups = data.map((group) => ({
                        label: group.groupName,
                        value: group.groupId.toString(),
                    }));
                    setGroups(formattedGroups);
                } catch (error) {
                    console.error("Error fetching groups:", error);
                    Alert.alert(
                        "Error",
                        "Failed to fetch groups. Please try again."
                    );
                }
            };
            fetchGroups();
        }, [])
    );

    // DateTimePicker handlers
    const showPicker = () => setDatePickerVisible(true);
    const hidePicker = () => setDatePickerVisible(false);
    const handleConfirm = (date) => {
        setExpiresAt(formatDateTime(date));
        hidePicker();
    };

    const formatDateTime = (date) => {
        // YYYY-MM-DD HH:MM:SS
        const pad = (n) => (n < 10 ? "0" + n : n);
        return (
            date.getFullYear() +
            "-" +
            pad(date.getMonth() + 1) +
            "-" +
            pad(date.getDate()) +
            " " +
            pad(date.getHours()) +
            ":" +
            pad(date.getMinutes()) +
            ":" +
            pad(date.getSeconds())
        );
    };

    // Quick buttons
    const applyQuickButton = (option) => {
        const now = new Date();
        let newDate = new Date();
        switch (option) {
            case "sofort":
                newDate.setHours(now.getHours() + 2);
                break;
            case "plus4":
                newDate.setHours(now.getHours() + 4);
                break;
            case "plus6":
                newDate.setHours(now.getHours() + 6);
                break;
            default:
                newDate = now;
        }
        setExpiresAt(formatDateTime(newDate));
    };


    const handleCreateTodo = async () => {
        if (!userId) {
            Alert.alert("Error", "User not logged in. Please log in again.");
            return;
        }
        if (!title || !expiresAt || !groupId) {
            Alert.alert(
                "Error",
                "Title, Expiration Date, and Group are required!"
            );
            return;
        }
        const formattedExpiresAt = expiresAt.replace(" ", "T") + "Z";

        const newTodo = {
            userOfferedId: userId,
            title,
            expiresAt: formattedExpiresAt,
            groupId: parseInt(groupId, 10),
            ...(description && { description }),
        };

        try {
            const token = await SecureStore.getItemAsync("authToken");
            const response = await fetch(
                "http://192.168.50.116:8082/api/todo/create",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(newTodo),
                }
            );
            if (!response.ok) {
                const errorData = await response.json();
                console.error("Error from backend:", errorData);
                throw new Error("Failed to create todo!");
            }
            Toast.show({
                type: "info",
                text1: "Todo created successfully.",
                visibilityTime: 1500,
            });
            // Reset fields
            setTitle("");
            setExpiresAt("");
            setGroupId(null);
            setDescription("");
            setShowDescription(false);
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
                        {/* Screen Title */}
                        <Text style={styles.screenTitle}>Create Todo</Text>
                        {/* Title */}
                        <Text style={styles.label}>Title</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter todo title"
                            value={title}
                            onChangeText={setTitle}
                        />

                        {/* Optional: Collapsible Description */}
                        <TouchableOpacity
                            style={styles.collapseButton}
                            onPress={() => setShowDescription(!showDescription)}
                        >
                            <Text style={styles.collapseButtonText}>
                                {showDescription ? "Hide" : "Add"} Description (optional)
                            </Text>
                            {showDescription ? (
                                <ChevronUp size={20} color="#5FC9C9" />
                            ) : (
                                <ChevronDown size={20} color="#5FC9C9" />
                            )}
                        </TouchableOpacity>

                        {showDescription && (
                            <View style={styles.collapsibleSection}>
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    placeholder="Add more details..."
                                    multiline
                                    numberOfLines={4}
                                    textAlignVertical="top"
                                    value={description}
                                    onChangeText={setDescription}
                                />
                            </View>
                        )}

                        {/* Group Selection */}
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

                        {/* Expires At */}
                        {/* Quick Buttons */}
                        <View style={styles.quickButtonContainer}>
                            <TouchableOpacity
                                style={styles.quickButtonModern}
                                onPress={() => applyQuickButton("sofort")}
                            >
                                <Text style={styles.quickButtonModernText}>Now (2h)</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.quickButtonModern}
                                onPress={() => applyQuickButton("plus4")}
                            >
                                <Text style={styles.quickButtonModernText}>+4h</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.quickButtonModern}
                                onPress={() => applyQuickButton("plus6")}
                            >
                                <Text style={styles.quickButtonModernText}>+6h</Text>
                            </TouchableOpacity>
                        </View>

                        {/* DateTime Picker Button */}
                        <TouchableOpacity style={styles.dateTimeButton} onPress={showPicker}>
                            <Text style={styles.dateTimeButtonText}>
                                {expiresAt ? expiresAt : "Pick Date & Time"}
                            </Text>
                        </TouchableOpacity>

                        <DateTimePickerModal
                            isVisible={isDatePickerVisible}
                            mode="datetime"
                            onConfirm={handleConfirm}
                            onCancel={hidePicker}
                        />

                        {/* Create Todo */}
                        <TouchableOpacity style={styles.createButton} onPress={handleCreateTodo}>
                            <Text style={styles.createButtonText}>Create Todo</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16 },
    scrollContainer: { flexGrow: 1 },
    inner: { flex: 1 },

    screenTitle: { 
        fontSize: 26, 
        fontWeight: "700", 
        marginBottom: 20, 
        color: "#333",
        textAlign: "center", 
    },

    label: { fontWeight: "bold", marginTop: 12 },
    input: {
        borderWidth: 1,
    },
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
        borderRadius: 5,
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
        marginBottom: 30,
        marginTop: 20,
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
    // Quick Buttons Modern
    quickButtonContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginVertical: 10,
    },
    quickButtonModern: {
        flex: 1,
        backgroundColor: "#E0F7FA",
        paddingVertical: 10,
        marginHorizontal: 4,
        borderRadius: 12,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#5FC9C9",
    },
    quickButtonModernText: { color: "#00796B", fontWeight: "600", fontSize: 14 },

    // DateTime Picker Button
    dateTimeButton: {
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#5FC9C9",
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 16,
        alignItems: "center",
        marginVertical: 10,
    },
    dateTimeButtonText: { color: "#5FC9C9", fontWeight: "600", fontSize: 15 },

    // Create Todo Button (unchanged)
    createButton: {
        backgroundColor: "#5FC9C9",
        padding: 12,
        borderRadius: 8,
        alignItems: "center",
        marginVertical: 80,
    },
    createButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});