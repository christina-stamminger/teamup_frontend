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
import Toast from 'react-native-toast-message';
import { useFocusEffect } from '@react-navigation/native';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { useNetwork } from "../components/context/NetworkContext"; // ✅ safeFetch importiert

export default function CreateTodoScreen() {
    const [title, setTitle] = useState("");
    const [expiresAt, setExpiresAt] = useState(null);
    const [expiresAtDisplay, setExpiresAtDisplay] = useState("");
    const [groupId, setGroupId] = useState(null);
    const [groups, setGroups] = useState([]);
    const [description, setDescription] = useState("");
    const [showDescription, setShowDescription] = useState(false);
    const [isTimeCritical, setIsTimeCritical] = useState(false);
    const [isDatePickerVisible, setDatePickerVisible] = useState(false);

    const { userId } = useUser();
    const { safeFetch } = useNetwork(); // ✅ Zugriff auf safeFetch

    useEffect(() => {
        console.log("userId from context:", userId);
    }, [userId]);

    // ✅ Gruppen laden mit safeFetch
    useFocusEffect(
        useCallback(() => {
            const fetchGroups = async () => {
                try {
                    const token = await SecureStore.getItemAsync("authToken");
                    const response = await safeFetch(
                        "http://192.168.50.116:8082/api/groups/myGroups",
                        {
                            method: "GET",
                            headers: {
                                Authorization: `Bearer ${token}`,
                                "Content-Type": "application/json",
                            },
                        }
                    );

                    if (response.offline) {
                        Alert.alert("Offline", "Keine Internetverbindung.");
                        return;
                    }

                    if (!response.ok) {
                        throw new Error("Fehler beim Laden der Gruppen.");
                    }

                    const data = await response.json();
                    const formattedGroups = data.map((group) => ({
                        label: group.groupName,
                        value: group.groupId.toString(),
                    }));
                    setGroups(formattedGroups);
                } catch (error) {
                    console.error("Fehler beim Laden der Gruppen:", error);
                    Alert.alert(
                        "Fehler",
                        "Gruppen konnten nicht geladen werden. Bitte versuche es erneut."
                    );
                }
            };
            fetchGroups();
        }, [safeFetch])
    );

    const showPicker = () => setDatePickerVisible(true);
    const hidePicker = () => setDatePickerVisible(false);
    const handleConfirm = (date) => {
        setExpiresAt(date);
        setExpiresAtDisplay(formatDateTime(date));
        hidePicker();
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return "";
        try {
            const date = new Date(dateString);
            return date.toLocaleString("de-DE", {
                weekday: "short",
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            });
        } catch (e) {
            console.error("❌ Fehler beim Formatieren von expiresAt:", e);
            return dateString;
        }
    };

    const applyQuickButton = (option) => {
        const now = new Date();
        let newDate = new Date();

        switch (option) {
            case "sofort":
                newDate.setHours(now.getHours() + 1);
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

        setExpiresAt(newDate);
        setExpiresAtDisplay(formatDateTime(newDate));
    };

    // ✅ Todo erstellen mit safeFetch
    const handleCreateTodo = async () => {
        if (!userId) {
            Alert.alert("Fehler", "Benutzer ist nicht eingeloggt. Bitte erneut anmelden.");
            return;
        }
        if (!title || !expiresAt || !groupId) {
            Alert.alert("Fehler", "Titel, Ablaufzeit und Gruppe sind erforderlich!");
            return;
        }

        const expiresWithBuffer = new Date(expiresAt.getTime() + 2 * 60 * 1000);
        const formattedExpiresAt = new Date(
            expiresWithBuffer.getTime() - expiresWithBuffer.getTimezoneOffset() * 60000
        ).toISOString().slice(0, 19);

        const newTodo = {
            userOfferedId: userId,
            title,
            expiresAt: formattedExpiresAt,
            groupId: parseInt(groupId, 10),
            isTimeCritical,
            ...(description && { description }),
        };

        try {
            const token = await SecureStore.getItemAsync("authToken");
            const response = await safeFetch("http://192.168.50.116:8082/api/todo/create", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(newTodo),
            });

            if (response.offline) {
                Alert.alert("Offline", "Keine Internetverbindung.");
                return;
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error("Fehler vom Backend:", errorData);
                throw new Error("Fehler beim Erstellen des Todos!");
            }

            Toast.show({
                type: "info",
                text1: "Todo wurde erfolgreich erstellt.",
                visibilityTime: 1500,
            });

            // Reset der Felder
            setTitle("");
            setExpiresAt(null);
            setExpiresAtDisplay("");
            setGroupId(null);
            setDescription("");
            setShowDescription(false);
            setIsTimeCritical(false);
        } catch (error) {
            console.error("Fehler:", error);
            Alert.alert("Fehler", "Todo konnte nicht erstellt werden. Bitte erneut versuchen.");
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
                        <Text style={styles.screenTitle}>Neues Todo erstellen</Text>

                        {/* Title */}
                        <Text style={styles.label}>Titel</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Titel eingeben"
                            value={title}
                            onChangeText={setTitle}
                        />

                        {/* Optional: Beschreibung */}
                        <TouchableOpacity
                            style={styles.collapseButton}
                            onPress={() => setShowDescription(!showDescription)}
                        >
                            <Text style={styles.collapseButtonText}>
                                {showDescription ? "Beschreibung ausblenden" : "Beschreibung hinzufügen (optional)"}
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
                                    placeholder="Weitere Details hinzufügen..."
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
                            placeholder="Gruppe auswählen"
                            value={groupId}
                            onChange={(item) => setGroupId(item.value)}
                        />

                        {/* Quick Buttons */}
                        <View style={styles.quickButtonContainer}>
                            <TouchableOpacity
                                style={styles.quickButtonModern}
                                onPress={() => applyQuickButton("sofort")}
                            >
                                <Text style={styles.quickButtonModernText}>Jetzt (1h)</Text>
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

                        {/* DateTime Picker */}
                        <TouchableOpacity style={styles.dateTimeButton} onPress={showPicker}>
                            <Text style={styles.dateTimeButtonText}>
                                {expiresAtDisplay ? expiresAtDisplay : "Datum & Uhrzeit wählen"}
                            </Text>
                        </TouchableOpacity>

                        <DateTimePickerModal
                            isVisible={isDatePickerVisible}
                            mode="datetime"
                            date={expiresAt || new Date()}
                            minimumDate={new Date(Date.now())}
                            onConfirm={handleConfirm}
                            onCancel={hidePicker}
                        />

                        {/* ⏰ Zeitkritisch Checkbox */}
                        <TouchableOpacity
                            style={styles.timeCriticalContainer}
                            onPress={() => setIsTimeCritical(!isTimeCritical)}
                            activeOpacity={0.7}
                        >
                            <View style={[
                                styles.checkbox,
                                isTimeCritical && styles.checkboxChecked
                            ]}>
                                {isTimeCritical && (
                                    <Text style={styles.checkmark}>✓</Text>
                                )}
                            </View>
                            <View style={styles.timeCriticalTextContainer}>
                                <Icon
                                    name="exclamation-triangle"
                                    size={16}
                                    color="#FF6B6B"
                                    style={{ marginRight: 6 }}
                                />
                                <Text style={styles.timeCriticalHint}>
                                    Nach Ablauf automatisch auf „Abgelaufen“ gesetzt
                                </Text>
                            </View>
                        </TouchableOpacity>

                        {/* Create Button */}
                        <TouchableOpacity style={styles.createButton} onPress={handleCreateTodo}>
                            <Text style={styles.createButtonText}>Todo erstellen</Text>
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
    createButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600"
    },
    timeCriticalContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 15,
        marginBottom: 10,
        paddingVertical: 12,
        paddingHorizontal: 15,
        backgroundColor: "#F8F9FA",
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: "#5FC9C9",
        backgroundColor: "#FFFFFF",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    checkboxChecked: {
        backgroundColor: "#5FC9C9",
        borderColor: "#5FC9C9",
    },
    checkmark: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "bold",
    },
    timeCriticalTextContainer: {
        flexDirection: 'row',      // 🔹 Icon und Text nebeneinander
        alignItems: 'center',      // 🔹 vertikal ausgerichtet
        marginTop: 6,
    },
    timeCriticalLabel: {
        fontSize: 16,
        fontWeight: "600",
        color: "#2C3E50",
        marginBottom: 2,
    },
    timeCriticalHint: {
        fontSize: 13,
        color: '#FF6B6B',
        fontWeight: '500',
    },
});