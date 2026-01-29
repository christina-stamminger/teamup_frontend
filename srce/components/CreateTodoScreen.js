import React, { useState, useCallback } from 'react';
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
import { useNetwork } from "../components/context/NetworkContext";
import Constants from "expo-constants";

const API_URL = Constants.expoConfig.extra.API_URL;

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
    const [loadingGroups, setLoadingGroups] = useState(false);

    //const { userId } = useUser();
    const { safeFetch } = useNetwork();

    // Fetch groups
    const { userId, accessToken } = useUser();

    const getAuthToken = useCallback(async () => {
        if (accessToken) return accessToken;
        return await SecureStore.getItemAsync("accessToken");
    }, [accessToken]);

    const fetchGroups = useCallback(async () => {
        if (!userId) return;

        console.log("📋 Fetching groups on screen focus...");

        try {
            setLoadingGroups(true);
            const token = await getAuthToken();

            const response = await safeFetch(`${API_URL}/api/groups/myGroups`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (response?.offline) {
                Toast.show({
                    type: 'info',
                    text1: 'Offline',
                    text2: 'Keine Internetverbindung',
                });
                return;
            }

            if (!response?.ok) throw new Error("Fehler beim Laden der Gruppen.");

            const data = await response.json();

            const formatted = data.map(g => ({
                label: g.groupName,
                value: g.groupId, // 
            }));

            setGroups(formatted);

            // neue Gruppe sofort sichtbar machen
            //if (!groupId && formatted.length > 0) {
            //  setGroupId(formatted[0].value);
            //}

            if (formatted.length > 0) {
                setGroupId(prev => prev ?? formatted[0].value);
            }


        } catch (e) {
            console.error(e);
        } finally {
            setLoadingGroups(false);
        }
    }, [userId, accessToken, safeFetch]);


    const { groupsVersion } = useUser();

    useFocusEffect(
        useCallback(() => {
            fetchGroups();
        }, [groupsVersion])   // Screen lädt neu bei jeder Gruppenänderung
    );


    const showPicker = () => setDatePickerVisible(true);
    const hidePicker = () => setDatePickerVisible(false);

    const handleConfirm = (date) => {
        setExpiresAt(date);
        setExpiresAtDisplay(formatDateTime(date));
        hidePicker();
    };

    const formatDateTime = (iso) => {
        const date = new Date(iso);
        const now = new Date();

        const isToday = date.toDateString() === now.toDateString();
        const isTomorrow =
            date.toDateString() ===
            new Date(now.getTime() + 86400000).toDateString();

        if (isToday) {
            return `Heute, ${date.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}`;
        }

        if (isTomorrow) {
            return `Morgen, ${date.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}`;
        }

        return date.toLocaleString("de-DE", {
            weekday: "short",
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
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

    const handleCreateTodo = async () => {
        Keyboard.dismiss(); // 👈 HIER

        // Validierung
        if (!userId) {
            Alert.alert("Fehler", "Benutzer ist nicht eingeloggt. Bitte erneut anmelden.");
            return;
        }

        if (!title.trim()) {
            Alert.alert("Fehler", "Bitte einen Titel eingeben!");
            return;
        }

        if (!expiresAt) {
            Alert.alert("Fehler", "Bitte eine Ablaufzeit wählen!");
            return;
        }

        if (!groupId) {
            Alert.alert("Fehler", "Bitte eine Gruppe auswählen!");
            return;
        }
        /*
                const expiresWithBuffer = new Date(expiresAt.getTime() + 2 * 60 * 1000);
                const formattedExpiresAt = new Date(
                    expiresWithBuffer.getTime() - expiresWithBuffer.getTimezoneOffset() * 60000
                ).toISOString().slice(0, 19);
        */

        /*
                const newTodo = {
                    userOfferedId: userId,
                    title: title.trim(),
                    expiresAt: formattedExpiresAt,
                    groupId: parseInt(groupId, 10),
                    isTimeCritical,
                    ...(description.trim() && { description: description.trim() }),
                };
        */
        const newTodo = {
            userOfferedId: userId,
            title: title.trim(),
            expiresAt: expiresAt.toISOString(), // 🔥 EINZIGE korrekte Lösung
            groupId: parseInt(groupId, 10),
            isTimeCritical,
            ...(description.trim() && { description: description.trim() }),
        };


        console.log("Creating todo:", newTodo);

        try {
            const token = await getAuthToken();
            const response = await safeFetch(
                `${API_URL}/api/todo/create`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(newTodo),
                }
            );

            if (response?.offline) {
                Alert.alert("Offline", "Keine Internetverbindung.");
                return;
            }

            if (!response?.ok) {
                throw new Error("Fehler beim Erstellen des Todos!");
            }

            console.log("✅ Todo created successfully");

            Toast.show({
                type: "success",
                text1: "Todo erfolgreich erstellt!",
                visibilityTime: 2000,
            });

            // ✅ Reset der Felder
            setTitle("");
            setExpiresAt(null);
            setExpiresAtDisplay("");
            // ✅ groupId NICHT zurücksetzen (User bleibt in Gruppe)
            setDescription("");
            setShowDescription(false);
            setIsTimeCritical(false);

        } catch (error) {
            console.error("❌ Fehler:", error);
            Alert.alert(
                "Fehler",
                "Todo konnte nicht erstellt werden. Bitte erneut versuchen."
            );
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0} // 👈 WICHTIG
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
                            placeholder="z.B. Hafermilch kaufen"
                            value={title}
                            onChangeText={setTitle}
                        />

                        {/* Optional: Beschreibung */}
                        <TouchableOpacity
                            style={styles.collapseButton}
                            onPress={() => setShowDescription(!showDescription)}
                        >
                            <Text style={styles.collapseButtonText}>
                                {showDescription
                                    ? "Beschreibung ausblenden"
                                    : "Beschreibung hinzufügen (optional)"
                                }
                            </Text>
                            {showDescription ? (
                                <ChevronUp size={20} color="#888" />
                            ) : (
                                <ChevronDown size={20} color="#888" />
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
                            placeholder={loadingGroups ? "Lade Gruppen..." : "Gruppe auswählen"}
                            value={groupId}
                            onChange={(item) => {
                                setGroupId(item.value);
                                console.log("✅ Selected group:", item.label);
                            }}
                            disable={loadingGroups}
                        />

                        {groups.length === 0 && !loadingGroups && (
                            <Text style={styles.noGroupsText}>
                            </Text>
                        )}

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
                                    Nach Ablauf automatisch auf „Abgelaufen" gesetzt
                                </Text>
                            </View>
                        </TouchableOpacity>

                        {/* Create Button */}
                        <TouchableOpacity
                            style={[
                                styles.createButton,
                                (!title || !expiresAt || !groupId) && styles.createButtonDisabled
                            ]}
                            onPress={handleCreateTodo}
                            disabled={!title || !expiresAt || !groupId}
                        >
                            <Text style={styles.createButtonText}>Todo erstellen</Text>
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
        paddingBottom: 120,
    },
    inner: {
        padding: 16,
    },
    screenTitle: {
        fontSize: 26,
        marginBottom: 24,
        marginTop: 24,
        color: '#111',
        textAlign: 'center',
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        marginTop: 14,
        marginBottom: 6,
        color: '#555',
    },
    input: {
        height: 50,
        borderRadius: 10,
        paddingHorizontal: 14,
        marginBottom: 18,
        backgroundColor: '#FFFFFF',
        fontSize: 16,

        // subtiler Schatten statt Border
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        elevation: 1,
    },
    textArea: {
        height: 100,
        textAlignVertical: "top",
        paddingTop: 12,
    },
    collapseButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
        marginBottom: 10,
    },
    collapseButtonText: {
        fontSize: 14,
        color: '#888',
    },
    collapsibleSection: {
        marginBottom: 10,
    },
    dropdown: {
        height: 50,
        borderRadius: 10,
        paddingHorizontal: 14,
        marginBottom: 20,
        backgroundColor: '#FFFFFF',
        elevation: 1,
    },
    noGroupsText: {
        fontSize: 14,
        color: '#FF6B6B',
        fontStyle: 'italic',
        marginBottom: 20,
        textAlign: 'center',
    },
    quickButtonContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 10,
    },
    quickButtonModern: {
        flex: 1,
        backgroundColor: '#E6F4F4',
        paddingVertical: 14,
        marginHorizontal: 6,
        borderRadius: 12,
        alignItems: 'center',
    },
    quickButtonModernText: {
        color: '#00796B',
        fontWeight: '600',
        fontSize: 15,
    },
    dateTimeButton: {
        backgroundColor: "#E6F4F4",
        borderColor: "#4FB6B8",
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 16,
        alignItems: "center",
        marginBottom: 15,
    },
    dateTimeButtonText: {
        color: "#00796B",
        fontWeight: "600",
        fontSize: 15,
    },
    timeCriticalContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 10,
        marginBottom: 10,
        paddingVertical: 12,
        paddingHorizontal: 15,
    },
    checkbox: {
        width: 26,
        height: 26,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#4FB6B8',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    checkboxChecked: {
        backgroundColor: "#4FB6B8",
        borderColor: "#4FB6B8",
    },
    checkmark: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "bold",
    },
    timeCriticalTextContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    timeCriticalHint: {
        fontSize: 13,
        color: '#856404',
        fontWeight: '500',
        flex: 1,
    },
    createButton: {
        backgroundColor: '#4FB6B8',
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 32,
        marginBottom: 40,
    },
    createButtonDisabled: {
        backgroundColor: "#D1D5DB",
    },
    createButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },
});