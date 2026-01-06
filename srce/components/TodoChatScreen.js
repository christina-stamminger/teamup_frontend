import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import TodoChat from "./TodoChat";
import { useUser } from './context/UserContext';

export default function TodoChatScreen({ route, navigation }) {
  // const { params } = useRoute();
  const { todo } = route.params;
  const { userId } = useUser();

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Kurze Rückfrage</Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              {todo.title}
            </Text>
          </View>

          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Feather name="x" size={22} />
          </TouchableOpacity>
        </View>

        {/* Chat */}
        <TodoChat
          todoId={todo.todoId}
          userId={userId}
          issuerId={todo.userOfferedId}
          fulfillerId={todo.userTakenId}
          todoStatus={todo.status}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  title: { fontSize: 17, fontWeight: "700" },
  subtitle: { fontSize: 13, color: "#6B7280", marginTop: 2 },
});
