import React, { useState, useEffect, useRef } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import Icon from "react-native-vector-icons/FontAwesome";
import Toast from "react-native-toast-message";

export default function TodoChat({ todoId, userId, issuerId, fulfillerId, todoStatus }) {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const flatListRef = useRef(null);

    const canChat = [issuerId, fulfillerId].includes(userId);
    const status = (todoStatus || "").toUpperCase();

    const isActive = status === "IN_ARBEIT";
    const isReadOnly = ["ERLEDIGT", "ABGELAUFEN"].includes(status);

    // 🔍 Debug initial state
    console.log("🔹 TodoChat mount:", {
        todoId,
        userId,
        issuerId,
        fulfillerId,
        todoStatus,
        canChat,
        isActive,
        isReadOnly,
    });

    // ⏬ Nachrichten laden bei aktivem Todo oder read-only Ansicht
    useEffect(() => {
        console.log("📥 useEffect triggered for fetchMessages()", {
            todoId,
            canChat,
            isActive,
            isReadOnly,
        });

        if (todoId && canChat && (isActive || isReadOnly)) {
            fetchMessages();
            if (isActive) {
                const interval = setInterval(fetchMessages, 8000);
                return () => {
                    console.log("🧹 Clearing interval for fetchMessages()");
                    clearInterval(interval);
                };
            }
        }
    }, [todoId, isActive, isReadOnly]);

    const fetchMessages = async () => {
        console.log("📡 Fetching messages for todo:", todoId);
        try {
            const token = await SecureStore.getItemAsync("accessToken");
            if (!token) {
                console.warn("⚠️ Kein Auth Token gefunden!");
                return;
            }

            const response = await fetch(
                `${API_URL}/api/todo/${todoId}/messages`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            console.log("📨 GET /messages response:", response.status);

            if (response.ok) {
                const data = await response.json();
                console.log("✅ Messages received:", data.length);
                setMessages(data);
                setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
            } else {
                const errText = await response.text();
                console.warn("❌ Fehler beim Laden der Nachrichten:", errText);
            }
        } catch (error) {
            console.error("💥 FetchMessages Exception:", error);
        }
    };

    const sendMessage = async () => {
        if (!newMessage.trim()) {
            console.log("⚠️ Empty message not sent.");
            return;
        }

        console.log("📤 Sende Nachricht:", newMessage);
        try {
            const token = await SecureStore.getItemAsync("accessToken");
            if (!token) {
                console.log("token: !" + token);
                return;
            }

            const response = await fetch(
                `${API_URL}/api/todo/${todoId}/messages`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        message: newMessage,
                        senderId: userId,
                    })

                }
            );

            console.log("📨 POST /messages response:", response.status);

            if (!response.ok) {
                const errText = await response.text();
                console.warn("❌ Fehler beim Senden:", errText);
                Toast.show({
                    type: "error",
                    text1: "Nachricht konnte nicht gesendet werden.",
                    visibilityTime: 1500,
                });
                return;
            }

            const saved = await response.json();
            console.log("✅ Nachricht gespeichert:", saved);
            setMessages((prev) => [...prev, saved]);
            setNewMessage("");
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        } catch (error) {
            console.error("💥 sendMessage Exception:", error);
        }
    };

    // ❌ Kein Chat für OFFEN oder fremde User
    if (!canChat) {
        console.log("🚫 Kein Zugriff auf Chat (nicht issuer/fulfiller).");
        return (
            <View style={styles.disabledContainer}>
                <Text style={styles.disabledText}>
                    Chat ist nur zwischen Ersteller und Übernehmer verfügbar.
                </Text>
            </View>
        );
    }

    if (status === "OFFEN") {
        console.log("💤 Todo ist OFFEN — Chat deaktiviert.");
        return (
            <View style={styles.disabledContainer}>
                <Text style={styles.disabledText}>
                    Chat verfügbar, sobald das Todo übernommen wurde.
                </Text>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.container}
        >
            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item) => item.messageId?.toString() ?? Math.random().toString()}
                renderItem={({ item }) => (
                    <View
                        style={[
                            styles.messageBubble,
                            item.senderId === userId ? styles.myMessage : styles.theirMessage,
                        ]}
                    >
                        <Text style={styles.messageText}>{item.message}</Text>
                    </View>
                )}
                contentContainerStyle={{ paddingBottom: 8 }}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            />

            {isActive && (
                <View style={styles.inputRow}>
                    <TextInput
                        style={styles.input}
                        placeholder="Nachricht schreiben..."
                        value={newMessage}
                        onChangeText={setNewMessage}
                    />
                    <TouchableOpacity onPress={sendMessage}>
                        <Icon name="send" size={18} color="#5FC9C9" />
                    </TouchableOpacity>
                </View>
            )}

            {isReadOnly && (
                <View style={styles.readOnlyBanner}>
                    <Text style={styles.readOnlyText}>
                        Dieses Todo ist {status === "ERLEDIGT" ? "erledigt" : "abgelaufen"}.
                        Der Chat ist schreibgeschützt.
                    </Text>
                </View>
            )}
        </KeyboardAvoidingView>
    );
}


const styles = StyleSheet.create({
    container: {
        backgroundColor: "#F8F8F8",
        borderRadius: 10,
        padding: 10,
        marginTop: 10,
    },
    chatTitle: {
        fontWeight: "600",
        fontSize: 14,
        color: "#333",
        marginBottom: 6,
    },
    messageBubble: {
        padding: 8,
        borderRadius: 10,
        marginVertical: 3,
        maxWidth: "75%",
    },
    myMessage: {
        alignSelf: "flex-end",
        backgroundColor: "#DCF8C6",
    },
    theirMessage: {
        alignSelf: "flex-start",
        backgroundColor: "#FFF",
    },
    messageText: {
        fontSize: 13,
        color: "#333",
    },
    inputRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 6,
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 6,
        marginRight: 8,
        backgroundColor: "#fff",
    },
    readOnlyBanner: {
        marginTop: 8,
        backgroundColor: "#EEE",
        borderRadius: 8,
        padding: 8,
    },
    readOnlyText: {
        fontSize: 12,
        color: "#555",
        textAlign: "center",
    },
    disabledContainer: {
        marginTop: 8,
        padding: 10,
        borderRadius: 8,
        backgroundColor: "#EEE",
    },
    disabledText: {
        fontSize: 13,
        color: "#666",
        textAlign: "center",
    },
});
