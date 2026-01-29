import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Keyboard
} from "react-native";
import * as SecureStore from "expo-secure-store";
import Icon from "react-native-vector-icons/FontAwesome";
import Toast from "react-native-toast-message";
import { API_URL } from "../config/env";


export default function TodoChat({
  todoId,
  userId,
  issuerId,
  fulfillerId,
  todoStatus,
}) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef(null);

  /* -------------------------------------------------- */
  /* Permissions & Status                               */
  /* -------------------------------------------------- */

  const status = (todoStatus || "").toUpperCase();

  const isParticipant =
    fulfillerId &&
    [issuerId, fulfillerId].includes(userId);

  const canWrite = status === "IN_ARBEIT";

  const canRead =
    isParticipant &&
    ["IN_ARBEIT", "ERLEDIGT", "ABGELAUFEN"].includes(status);



  // ✍️ Schreibbar nur während IN_ARBEIT
  const isActive = status === "IN_ARBEIT";
  const isReadOnly = ["ERLEDIGT", "ABGELAUFEN"].includes(status);


  // KEYBOARD

  /* -------------------------------------------------- */
  /* Load Messages                                      */
  /* -------------------------------------------------- */

  useEffect(() => {
    if (!todoId || !canRead) return;

    fetchMessages();



    if (canWrite) {
      const interval = setInterval(fetchMessages, 8000);
      return () => clearInterval(interval);
    }
  }, [todoId, canRead, canWrite]);




  const fetchMessages = async () => {
    try {
      const token = await SecureStore.getItemAsync("accessToken");
      if (!token) return;

      const response = await fetch(
        `${API_URL}/api/todo/${todoId}/messages`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.ok) {
        const data = await response.json();
        setMessages(data);

        // ✅ lastSeen auf SERVER-Zeit setzen
        if (Array.isArray(data) && data.length > 0) {
          const latest = data[data.length - 1];
          if (latest?.createdAt) {
            await SecureStore.setItemAsync(
              `chat_last_seen_${todoId}`,
              new Date(latest.createdAt).getTime().toString()
            );
          }
        }
      }
    } catch (e) {
      console.error("Fetch messages error:", e);
    }
  };



  /* -------------------------------------------------- */
  /* Send Message                                       */
  /* -------------------------------------------------- */

  const sendMessage = async () => {

    if (!newMessage.trim()) return;
    Keyboard.dismiss();
    try {
      const token = await SecureStore.getItemAsync("accessToken");
      if (!token) return;

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
          }),
        }
      );

      if (!response.ok) {
        Toast.show({
          type: "error",
          text1: "Nachricht konnte nicht gesendet werden.",
        });
        return;
      }

      const saved = await response.json();
      setMessages((prev) => [...prev, saved]);
      setNewMessage("");
    } catch (e) {
      console.error("Send message error:", e);
    }
  };

  /* -------------------------------------------------- */
  /* Guards                                             */
  /* -------------------------------------------------- */




  /* -------------------------------------------------- */
  /* Render                                             */
  /* -------------------------------------------------- */

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "android" ? 48 : 0}
    >

      <View style={styles.container}>
        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingVertical: 12, paddingHorizontal: 18 }}
          keyboardShouldPersistTaps="always"
          onContentSizeChange={() =>
            scrollRef.current?.scrollToEnd({ animated: true })
          }
        >
          {messages.length === 0 ? (
            <Text style={styles.emptyText}>Noch keine Nachrichten</Text>
          ) : (
            messages.map((item) => (
              <View
                key={item.messageId}
                style={[
                  styles.messageBubble,
                  item.senderId === userId
                    ? styles.myMessage
                    : styles.theirMessage,
                ]}
              >
                <Text style={styles.messageText}>{item.message}</Text>
              </View>
            ))
          )}
        </ScrollView>

        {/* Read-only Hinweis */}
        {isReadOnly && (
          <View style={styles.readOnlyBanner}>
            <Text style={styles.readOnlyText}>
              Dieses Todo ist{" "}
              {status === "ERLEDIGT" ? "erledigt" : "abgelaufen"}.
              Der Chat ist schreibgeschützt.
            </Text>
          </View>
        )}

        {/* Input */}
        {isActive && (
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Nachricht schreiben…"
              value={newMessage}
              onChangeText={setNewMessage}
              multiline
            />
            <TouchableOpacity
              onPress={sendMessage}
              style={styles.sendButton}
            >
              <Icon name="send" size={18} color="#4FB6B8" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

/* -------------------------------------------------- */
/* Styles                                             */
/* -------------------------------------------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  disabledContainer: {
    padding: 16,
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
  },
  disabledText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    fontStyle: "italic",
  },

  emptyText: {
    textAlign: "center",
    marginTop: 40,
    color: "#9CA3AF",
    fontSize: 14,
  },

  messageBubble: {
    maxWidth: "75%",
    padding: 10,
    borderRadius: 12,
    marginVertical: 4,
    marginHorizontal: 4,
  },
  myMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#4FB6B8",
  },
  theirMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#E5E7EB",
  },
  messageText: {
    fontSize: 14,
    color: "#1F2937",
  },

  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    //paddingBottom: 40, // Notlösung,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#FFF",
    maxHeight: 120,
  },
  sendButton: {
    padding: 12,
    marginLeft: 8,
  },

  readOnlyBanner: {
    backgroundColor: "#FEF3C7",
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: "#F59E0B",
  },
  readOnlyText: {
    fontSize: 13,
    color: "#92400E",
    textAlign: "center",
  },
});
