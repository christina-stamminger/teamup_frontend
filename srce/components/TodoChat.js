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
import Constants from "expo-constants";

const API_URL = Constants.expoConfig.extra.API_URL;

export default function TodoChat({
  todoId,
  userId,
  issuerId,
  fulfillerId,
  todoStatus,
}) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const flatListRef = useRef(null);

  const canChat = [issuerId, fulfillerId].includes(userId);
  const status = (todoStatus || "").toUpperCase();

  const isActive = status === "IN_ARBEIT";
  const isReadOnly = ["ERLEDIGT", "ABGELAUFEN"].includes(status);

  /* -------------------------------------------------- */
  /* Keyboard Handling                                  */
  /* -------------------------------------------------- */


  /* -------------------------------------------------- */
  /* Messages                                           */
  /* -------------------------------------------------- */
  useEffect(() => {
    if (!todoId || !canChat) return;

    fetchMessages();
    if (isActive) {
      const interval = setInterval(fetchMessages, 8000);
      return () => clearInterval(interval);
    }
  }, [todoId, isActive]);

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
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    } catch (e) {
      console.error("Fetch messages error:", e);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

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

      Keyboard.dismiss();

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (e) {
      console.error("Send message error:", e);
    }
  };

  /* -------------------------------------------------- */
  /* Guards                                             */
  /* -------------------------------------------------- */
  if (!canChat) {
    return (
      <View style={styles.disabledContainer}>
        <Text style={styles.disabledText}>
          Chat ist nur zwischen Ersteller und Übernehmer verfügbar.
        </Text>
      </View>
    );
  }

  if (status === "OFFEN") {
    return (
      <View style={styles.disabledContainer}>
        <Text style={styles.disabledText}>
          Chat verfügbar, sobald das Todo übernommen wurde.
        </Text>
      </View>
    );
  }

  /* -------------------------------------------------- */
  /* Render                                             */
  /* -------------------------------------------------- */
  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={messages}
        nestedScrollEnabled={true}
        style={{ flex: 1 }}              // ✅
        contentContainerStyle={{
          paddingBottom: 10,
        }}
        onContentSizeChange={() =>       // ✅ WICHTIG
          flatListRef.current?.scrollToEnd({ animated: true })
        } keyExtractor={(item) =>
          item.messageId?.toString() ?? Math.random().toString()
        }
        renderItem={({ item }) => (
          <View
            style={[
              styles.messageBubble,
              item.senderId === userId
                ? styles.myMessage
                : styles.theirMessage,
            ]}
          >
            <Text style={styles.messageText}>{item.message}</Text>
          </View>
        )}
        keyboardShouldPersistTaps="handled"
      />

      {isActive && (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={80}
        >
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Nachricht schreiben..."
              value={newMessage}
              onChangeText={setNewMessage}
              multiline
              returnKeyType="send"
              onSubmitEditing={sendMessage}
            />

            <TouchableOpacity
              onPress={sendMessage}
              style={styles.sendButton}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            >
              <Icon name="send" size={18} color="#5FC9C9" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}

      {
        isReadOnly && (
          <View style={styles.readOnlyBanner}>
            <Text style={styles.readOnlyText}>
              Dieses Todo ist{" "}
              {status === "ERLEDIGT" ? "erledigt" : "abgelaufen"}.
              Der Chat ist schreibgeschützt.
            </Text>
          </View>

        )
      }
    </View >
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 15,
    maxHeight: 320,        // 👈 fix
    flexDirection: "column",
  },

  disabledContainer: {
    padding: 15,
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    marginTop: 15,
  },
  disabledText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    fontStyle: "italic",
  },
  messageBubble: {
    maxWidth: "75%",
    padding: 10,
    borderRadius: 12,
    marginVertical: 4,
  },
  myMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#5FC9C9",
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
    paddingTop: 10,
    paddingBottom: 5,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    backgroundColor: "#FFF",
    maxHeight: 100,
  },
  sendButton: {
    padding: 12,
    minWidth: 48,
    minHeight: 48,
    justifyContent: "center",
    alignItems: "center",
  },

  readOnlyBanner: {
    backgroundColor: "#FEF3C7",
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#F59E0B",
  },
  readOnlyText: {
    fontSize: 13,
    color: "#92400E",
    fontWeight: "500",
  },
});