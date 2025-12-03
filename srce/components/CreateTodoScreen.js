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

    const { userId } = useUser();
    const { safeFetch } = useNetwork();

    // ✅ Gruppen laden bei Screen-Fokus
    useFocusEffect(
        useCallback(() => {
            let isMounted = true; // ✅ Cleanup-Flag

            const fetchGroups = async () => {
                if (!isMounted) return;
                
                console.log("📋 Fetching groups on screen focus...");
                
                try {
                    setLoadingGroups(true);
                    const token = await SecureStore.getItemAsync("accessToken");
                    
                    const response = await safeFetch(
                        `${API_URL}/api/groups/myGroups`,
                        {
                            method: "GET",
                            headers: {
                                Authorization: `Bearer ${token}`,
                                "Content-Type": "application/json",
                            },
                        }
                    );

                    if (!isMounted) return; // ✅ Abbruch falls unmounted

                    if (response?.offline) {
                        Toast.show({
                            type: 'info',
                            text1: 'Offline',
                            text2: 'Keine Internetverbindung',
                            visibilityTime: 2000
                        });
                        return;
                    }

                    if (!response?.ok) {
                        throw new Error("Fehler beim Laden der Gruppen.");
                    }

                    const data = await response.json();
                    console.log("✅ Loaded groups:", data.length);
                    
                    const formattedGroups = data.map((group) => ({
                        label: group.groupName,
                        value: group.groupId.toString(),
                    }));
                    
                    if (isMounted) {
                        setGroups(formattedGroups);
                        
                        // ✅ Wenn nur 1 Gruppe → automatisch auswählen
                        if (formattedGroups.length === 1 && !groupId) {
                            setGroupId(formattedGroups[0].value);
                            console.log("✅ Auto-selected single group:", formattedGroups[0].label);
                        }
                    }
                    
                } catch (error) {
                    console.error("❌ Fehler beim Laden der Gruppen:", error);
                    if (isMounted) {
                        Toast.show({
                            type: 'error',
                            text1: 'Fehler',
                            text2: 'Gruppen konnten nicht geladen werden',
                            visibilityTime: 2000
                        });
                    }
                } finally {
                    if (isMounted) {
                        setLoadingGroups(false);
                    }
                }
            };

            fetchGroups();

            // ✅ Cleanup-Funktion
            return () => {
                isMounted = false;
                console.log("🧹 CreateTodoScreen cleanup");
            };
        }, []) // ✅ Leere Dependencies - lädt bei jedem Fokus
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

    const handleCreateTodo = async () => {
        // ✅ Validierung
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

        const expiresWithBuffer = new Date(expiresAt.getTime() + 2 * 60 * 1000);
        const formattedExpiresAt = new Date(
            expiresWithBuffer.getTime() - expiresWithBuffer.getTimezoneOffset() * 60000
        ).toISOString().slice(0, 19);

        const newTodo = {
            userOfferedId: userId,
            title: title.trim(),
            expiresAt: formattedExpiresAt,
            groupId: parseInt(groupId, 10),
            isTimeCritical,
            ...(description.trim() && { description: description.trim() }),
        };

        console.log("📤 Creating todo:", newTodo);

        try {
            const token = await SecureStore.getItemAsync("accessToken");
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
                const errorData = await response.json().catch(() => ({}));
                console.error("❌ Fehler vom Backend:", errorData);
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
                                <ChevronUp size={20} color="#404040" />
                            ) : (
                                <ChevronDown size={20} color="#404040" />
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
    },
    inner: {
        padding: 16,
    },
    screenTitle: {
        fontSize: 26,
        marginBottom: 20,
        marginTop: 20,
        color: "#333",
        textAlign: "center",
        fontWeight: "600",
    },
    label: {
        fontSize: 16,
        fontWeight: "600",
        marginTop: 12,
        marginBottom: 8,
        color: "#333",
    },
    input: {
        height: 48,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        paddingHorizontal: 12,
        marginBottom: 16,
        backgroundColor: '#FFF',
        fontSize: 16,
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
        color: '#404040',
        fontWeight: '500',
    },
    collapsibleSection: {
        marginBottom: 10,
    },
    dropdown: {
        height: 48,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        paddingHorizontal: 12,
        marginBottom: 20,
        backgroundColor: '#FFF',
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
        backgroundColor: "#E0F7FA",
        paddingVertical: 12,
        marginHorizontal: 4,
        borderRadius: 8,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#5FC9C9",
    },
    quickButtonModernText: {
        color: "#00796B",
        fontWeight: "600",
        fontSize: 14,
    },
    dateTimeButton: {
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#5FC9C9",
        borderRadius: 8,
        paddingVertical: 14,
        paddingHorizontal: 16,
        alignItems: "center",
        marginBottom: 15,
    },
    dateTimeButtonText: {
        color: "#5FC9C9",
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
        backgroundColor: "#5FC9C9",
        padding: 16,
        borderRadius: 8,
        alignItems: "center",
        marginTop: 30,
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