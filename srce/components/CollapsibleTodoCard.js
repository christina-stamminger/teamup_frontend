import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Keyboard,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import { MaterialIcons } from "@expo/vector-icons";
import { useUser } from "../components/context/UserContext";
import { getStatusColor } from "../utils/statusHelpers";
import * as SecureStore from "expo-secure-store";
import Icon from "react-native-vector-icons/FontAwesome";
import { MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import TodoChat from "./TodoChat";
import Constants from "expo-constants";

const API_URL = Constants.expoConfig.extra.API_URL;

const CollapsibleTodoCard = ({ todo, onStatusUpdated, onDelete, expiresAt }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { userId, loading, setBringits } = useUser();
  const isFocused = useIsFocused();
  const swipeableRef = useRef(null);
  const scrollRef = useRef(null);

  const toggleExpand = () => setIsExpanded(!isExpanded);
  const statusColor = getStatusColor(todo.status);

  // 👇 Keyboard Handling – wenn Keyboard sichtbar wird, nach unten scrollen
  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", () => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
    const hideSub = Keyboard.addListener("keyboardDidHide", () => {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // 🟢 PATCH Todo Status
  const updateTodoStatus = async (newStatus = "IN_ARBEIT") => {
    try {
      const token = await SecureStore.getItemAsync("accessToken");
      const currentTime = new Date().toISOString();

      const response = await fetch(`${API_URL}/api/todo/status`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          todoId: todo.todoId,
          userTakenId: userId,
          status: newStatus,
          completedAt: newStatus === "ERLEDIGT" ? currentTime : null,
        }),
      });

      const result = await response.json();


      // 🔥 DAS WAR DER FEHLENDE TEIL
      if (response.ok && typeof result.bringIts === "number") {
        setBringits(result.bringIts);
      }
      console.log("XXXXX bringits:", result);

      //const result = await response.json();
      if (!response.ok) {
        Toast.show({
          type: "error",
          text1: result.errorMessage || "Todos konnten nicht aktualisiert werden.",
          visibilityTime: 2000,
        });
      } else {
        Toast.show({
          type: "success",
          text1: "Todo-Status erfolgreich geändert.",
          visibilityTime: 1500,
        });
        onStatusUpdated?.();
      }
    } catch (error) {
      console.error("Fehler beim Aktualisieren:", error);
      alert("Netzwerkfehler.");
    }
  };

  if (loading) return <Text>Loading...</Text>;

  // 🗑️ Todo löschen
  const deleteTodo = async () => {
    if ((todo.status || "").toUpperCase() === "IN_ARBEIT") {
      Toast.show({
        type: "error",
        text1: "Todos in Arbeit können nicht gelöscht werden.",
        visibilityTime: 2000,
      });
      swipeableRef.current?.close();
      return;
    }

    try {
      const token = await SecureStore.getItemAsync("accessToken");
      const response = await fetch(
        `${API_URL}/api/todo/${todo.todoId}/trash`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const result = await response.json();
      if (!response.ok) {
        Toast.show({
          type: "error",
          text1: result.errorMessage || "Todo konnte nicht gelöscht werden.",
          visibilityTime: 2000,
        });
      } else {
        Toast.show({
          type: "success",
          text1: "Todo in Papierkorb verschoben.",
          visibilityTime: 1500,
        });
        onDelete?.(todo.todoId);
        if (isFocused) onStatusUpdated?.();
        swipeableRef.current?.close();
      }
    } catch (error) {
      console.error("Fehler beim Löschen:", error);
      Toast.show({
        type: "error",
        text1: "Netzwerkfehler.",
        visibilityTime: 2000,
      });
    }
  };

  const renderRightActions = () => (
    <View style={styles.deleteButton}>
      <TouchableOpacity onPress={deleteTodo} style={styles.deleteButtonContent}>
        <MaterialIcons name="delete" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );

  return (

    <Swipeable ref={swipeableRef} renderRightActions={renderRightActions}>
      <View
        style={[
          styles.card,
          todo.isTimeCritical && styles.timeCriticalCard,
        ]}
      >
        {/* 🔹 HEADER – klickbar */}
        <TouchableOpacity
          onPress={toggleExpand}
          activeOpacity={0.85}
        >
          {/* Status Badge */}
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusBadgeText}>{todo.status}</Text>
          </View>

          {/* Titel */}
          <Text style={styles.title}>{todo.title}</Text>

          {/* User Infos */}
          <View style={styles.userBlock}>
            <View style={styles.userRow}>
              <Icon name="user" size={16} color="#666" style={styles.icon} />
              <Text style={styles.userValue}>
                {todo.username} {userId === todo.userOfferedId ? "(Du)" : ""}
              </Text>
            </View>

            {todo.userTakenUsername && (
              <View style={styles.userRow}>
                <Icon name="check" size={16} color="#28a745" style={styles.icon} />
                <Text style={styles.userValue}>
                  {todo.userTakenUsername}{" "}
                  {userId === todo.userTakenId ? "(Du)" : ""}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        {/* 🔹 BODY – NICHT klickbar */}
        {isExpanded && (
          <View style={styles.additionalContent}>
            {/* Description */}
            {todo.description && (
              <View style={styles.detailRow}>
                <Feather
                  name="file-text"
                  size={18}
                  color="#4B5563"
                  style={styles.icon}
                />
                <Text style={styles.detailText}>{todo.description}</Text>
              </View>
            )}

            {!todo.userTakenId && (
              <Text style={styles.userTakenText}>
                Dieses Todo wurde noch nicht übernommen.
              </Text>
            )}

            {/* Zeitkritisch */}
            {todo.isTimeCritical && (
              <View style={styles.timeCriticalWarning}>
                <Icon
                  name="exclamation-triangle"
                  size={16}
                  color="#FF6B6B"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.timeCriticalWarningText}>
                  Zeitkritisch: Nach Ablauf automatisch abgelaufen
                </Text>
              </View>
            )}

            {/* Zeitabschnitt */}
            <View style={styles.timeContainer}>
              {/* Expires */}
              <View style={styles.timeBlock}>
                <View style={styles.timeHeader}>
                  <Icon
                    name="clock-o"
                    size={14}
                    color={statusColor}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={[styles.timeLabel, { color: statusColor }]}>
                    Läuft ab:
                  </Text>
                </View>
                <Text style={[styles.timeMain, { color: statusColor }]}>
                  {new Date(todo.expiresAt).toLocaleTimeString("de-DE", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
                <Text style={styles.timeSub}>
                  {new Date(todo.expiresAt).toLocaleDateString("de-DE", {
                    weekday: "short",
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </Text>
              </View>

              {/* Completed */}
              {todo.completedAt && (
                <View
                  style={[
                    styles.timeBlock,
                    { borderLeftWidth: 1, borderLeftColor: "#e0e0e0" },
                  ]}
                >
                  <View style={styles.timeHeader}>
                    <Icon
                      name="check"
                      size={14}
                      color="#4CAF50"
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      style={[styles.timeLabel, { color: "#4CAF50" }]}
                    >
                      Erledigt
                    </Text>
                  </View>
                  <Text style={[styles.timeMain, { color: "#4CAF50" }]}>
                    {new Date(todo.completedAt).toLocaleTimeString("de-DE", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                  <Text style={styles.timeSub}>
                    {new Date(todo.completedAt).toLocaleDateString("de-DE", {
                      weekday: "short",
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </Text>
                </View>
              )}
            </View>

            {/* Buttons */}
            {todo.status === "OFFEN" && todo.userOfferedId !== userId && (
              <TouchableOpacity
                style={styles.takeButton}
                onPress={() => updateTodoStatus("IN_ARBEIT")}
              >
                <Text style={styles.takeButtonText}>Ich mach's</Text>
              </TouchableOpacity>
            )}

            {todo.userTakenUsername &&
              todo.userTakenId === userId &&
              todo.status === "IN_ARBEIT" && (
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[
                      styles.statusButton,
                      { backgroundColor: "#6BA8D1" },
                    ]}
                    onPress={() => updateTodoStatus("ERLEDIGT")}
                  >
                    <Icon
                      name="check"
                      size={16}
                      color="#fff"
                      style={styles.buttonIcon}
                    />
                    <Text style={styles.statusButtonText}>Erledigt</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.statusButton,
                      { backgroundColor: "#e0e0e0" },
                    ]}
                    onPress={() =>
                      Alert.alert(
                        "Abbrechen",
                        "Möchtest du das Todo wieder freigeben?",
                        [
                          {
                            text: "Ja",
                            onPress: () => updateTodoStatus("OFFEN"),
                          },
                          { text: "Abbrechen", style: "cancel" },
                        ]
                      )
                    }
                  >
                    <Icon
                      name="times"
                      size={16}
                      color="#fff"
                      style={styles.buttonIcon}
                    />
                    <Text style={styles.statusButtonText}>Abbrechen</Text>
                  </TouchableOpacity>
                </View>
              )}

            {/* 💬 Chat unten */}
            <TodoChat
              todoId={todo.todoId}
              userId={userId}
              issuerId={todo.userOfferedId}
              fulfillerId={todo.userTakenId}
              todoStatus={todo.status}
              parentScrollRef={scrollRef}
            />
          </View>
        )}
      </View>
    </Swipeable>
  );
};


const styles = StyleSheet.create({
  completedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  completedText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#28A745',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginVertical: 10,
    borderWidth: 0,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    position: 'relative',
  },
  statusBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    zIndex: 1,
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 20,
    color: '#333',
    marginBottom: 10,
    paddingRight: 110, // Platz für Status-Badge
  },
  userBlock: {
    marginBottom: 10,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  icon: {
    marginRight: 6,
  },
  userLabel: {
    fontSize: 13,
    color: 'grey',
    fontWeight: '500',
    marginRight: 4,
  },
  userValue: {
    fontSize: 13,
    color: '#333',
  },
  additionalContent: {
    marginTop: 10,
  },
  description: {
    fontSize: 14,
    color: '#555',
    marginBottom: 5,
  },
  userTakenText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#333',
    marginBottom: 10,
  },
  takeButton: {
    marginTop: 10,
    backgroundColor: '#5FC994',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  takeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    gap: 10,
  },
  statusButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  statusButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonIcon: {
    marginRight: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  detailText: {
    fontSize: 16,
    color: '#444',
    flex: 1,
    lineHeight: 20,
  },
  expiryRow: {
    alignItems: 'center',
    marginTop: 10,
  },
  expiryTime: {
    fontSize: 16,
    fontWeight: '600',
  },
  expiryDate: {
    fontSize: 13,
    color: '#555',
    marginTop: 2,
  },
  expiryText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#DC2626',
  },
  completedDate: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 2,
    lineHeight: 18,
  },
  animatedCard: {
    marginBottom: 10,
  },
  deleteButton: {
    backgroundColor: '#E74C3C',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    marginVertical: 10,
    borderRadius: 10,
  },
  deleteButtonContent: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 14,
    paddingVertical: 6,
    borderTopWidth: 0.5,
    borderTopColor: '#ddd',
  },
  timeBlock: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  timeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  timeLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  timeMain: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 20,
  },
  timeSub: {
    fontSize: 13,
    color: '#777',
    marginTop: 2,
    textAlign: 'center',
  },
  timeCriticalCard: {
    borderLeftWidth: 4,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    borderLeftColor: '#FF3B3B',
  },
  timeCriticalWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE5E5',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B6B',
  },
  timeCriticalWarningText: {
    flex: 1,
    fontSize: 13,
    color: '#C92A2A',
    fontWeight: '500',
  },
});

export default CollapsibleTodoCard;
