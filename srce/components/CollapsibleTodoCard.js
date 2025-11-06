import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated'; // ✅ new reanimated animation lib

import { MaterialIcons } from '@expo/vector-icons';
import { useUser } from '../components/context/UserContext';
import { getStatusColor } from '../utils/statusHelpers';
import * as SecureStore from 'expo-secure-store';
import Icon from 'react-native-vector-icons/FontAwesome';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native'; // Import the hook
import Toast from 'react-native-toast-message'; // toast: for short messages intead of alert


const CollapsibleTodoCard = ({ todo, onStatusUpdated, onDelete, expiresAt }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { userId, loading } = useUser();
  const isFocused = useIsFocused();
  const swipeableRef = useRef(null);

  const toggleExpand = () => setIsExpanded(!isExpanded);

  const statusColor = getStatusColor(todo.status);

  // ✅ Formatierung
  const formatDateTime = (dateString) => {
    if (!dateString) return "";

    try {
      const date = new Date(dateString);

      const time = date.toLocaleTimeString("de-DE", {
        hour: "2-digit",
        minute: "2-digit",
      });

      const datePart = date.toLocaleDateString("de-DE", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
      });

      return `${time}\n${datePart}`;
    } catch (e) {
      console.error("❌ Fehler beim Formatieren des Datums:", e);
      return dateString;
    }
  };

  // Update PATCH todostatus
  const updateTodoStatus = async (newStatus = 'IN_ARBEIT') => {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      const currentTime = new Date().toISOString();

      const response = await fetch('http://192.168.50.116:8082/api/todo/status', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          todoId: todo.todoId,
          userTakenId: userId,
          status: newStatus,
          completedAt: newStatus === 'ERLEDIGT' ? currentTime : null,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        Toast.show({
          type: 'error',
          text1: result.errorMessage || 'Todos could not be updated.',
          visibilityTime: 2000,
        });
      } else {
        Toast.show({
          type: 'success',
          text1: 'Todo status updated successfully.',
          visibilityTime: 1500,
        });
        onStatusUpdated?.();
      }

    } catch (error) {
      console.error('Fehler beim Aktualisieren:', error);
      alert('Netzwerkfehler.');
    }
  };

  if (loading) return <Text>Loading...</Text>;

  // Swipe to delete
  const deleteTodo = async () => {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      const response = await fetch(`http://192.168.50.116:8082/api/todo/${todo.todoId}/trash`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        Toast.show({
          type: 'error',
          text1: result.errorMessage || 'Todo could not be deleted.',
          visibilityTime: 2000,
        });
      } else {
        Toast.show({
          type: 'success',
          text1: 'Todo moved to trash successfully!',
          visibilityTime: 1500,
        });

        onDelete?.(todo.todoId);

        if (isFocused) {
          onStatusUpdated?.();
        }

        swipeableRef.current?.close();
      }
    } catch (error) {
      console.error('Fehler beim Löschen:', error);
      alert('Netzwerkfehler.');
    }
  };

  const renderRightActions = () => {
    return (
      <View style={styles.deleteButton}>
        <TouchableOpacity onPress={deleteTodo} style={styles.deleteButtonContent}>
          <MaterialIcons name="delete" size={24} color="white" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Swipeable ref={swipeableRef} renderRightActions={renderRightActions}>
      <TouchableOpacity
        style={[
          styles.card,
         // { borderColor: statusColor },
          // ⏰ Zeitkritisch = dicker roter Rand
          todo.isTimeCritical && styles.timeCriticalCard
        ]}
        onPress={toggleExpand}
      >
        {/* ⏰ NEU: Zeitkritisch-Badge (oben rechts) */}
     

        {/* Status badge */}
        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
          <Text style={styles.statusBadgeText}>{todo.status}</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>{todo.title}</Text>

        {/* Issuer / Taken by */}
        <View style={styles.userBlock}>
          <View style={styles.userRow}>
            <Icon name="user" size={16} color="#666" style={styles.icon} />
            <Text style={styles.userValue}>
              {todo.username} {userId === todo.userOfferedId ? '(You)' : ''}
            </Text>
          </View>

          {todo.userTakenUsername && (
            <View style={styles.userRow}>
              <Icon name="check" size={16} color="#28a745" style={styles.icon} />
              <Text style={styles.userValue}>
                {todo.userTakenUsername} {userId === todo.userTakenId ? '(You)' : ''}
              </Text>
            </View>
          )}
        </View>

        {isExpanded && (
          <View style={styles.additionalContent}>
            {/* Description */}
            {todo.description && (
              <View style={styles.detailRow}>
                <Feather name="file-text" size={18} color="#4B5563" style={styles.icon} />
                <Text style={styles.detailText}>{todo.description}</Text>
              </View>
            )}

            {!todo.userTakenId && (
              <Text style={styles.userTakenText}>No user has taken this task yet.</Text>
            )}

            {/* ⏰ NEU: Zeitkritisch-Warnung (expanded) */}
            {todo.isTimeCritical && (
              <View style={styles.timeCriticalWarning}>
                <Icon name="exclamation-triangle" size={16} color="#FF6B6B" style={{ marginRight: 8 }} />
                <Text style={styles.timeCriticalWarningText}>
                  Zeitkritisch: Nach Ablauf automatisch expired
                </Text>
              </View>
            )}

            {/* Zeitabschnitt */}
            <View style={styles.timeContainer}>
              {/* ExpiresAt */}
              <View style={styles.timeBlock}>
                <View style={styles.timeHeader}>
                  <Icon name="clock-o" size={14} color={statusColor} style={{ marginRight: 6 }} />
                  <Text style={[styles.timeLabel, { color: statusColor }]}>Expires</Text>
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

              {/* CompletedAt */}
              {todo.completedAt && (
                <View style={[styles.timeBlock, { borderLeftWidth: 1, borderLeftColor: "#e0e0e0" }]}>
                  <View style={styles.timeHeader}>
                    <Icon name="check" size={14} color="#4CAF50" style={{ marginRight: 6 }} />
                    <Text style={[styles.timeLabel, { color: "#4CAF50" }]}>Completed</Text>
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

            {/* Take button if open */}
            {todo.status === 'OFFEN' && todo.userOfferedId !== userId && (
              <TouchableOpacity
                style={styles.takeButton}
                onPress={() => updateTodoStatus('IN_ARBEIT')}
              >
                <Text style={styles.takeButtonText}>I'll bring it</Text>
              </TouchableOpacity>
            )}

            {/* Fulfilled & Cancel buttons */}
            {todo.userTakenUsername && todo.userTakenId === userId && todo.status === 'IN_ARBEIT' && (
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.statusButton, { backgroundColor: '#6BA8D1' }]}
                  onPress={() => updateTodoStatus('ERLEDIGT')}
                >
                  <Icon name="check" size={16} color="#fff" style={styles.buttonIcon} />
                  <Text style={styles.statusButtonText}>Completed</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.statusButton, { backgroundColor: '#e0e0e0' }]}
                  onPress={() =>
                    Alert.alert(
                      'Cancel',
                      'Do you want to give back todo?',
                      [
                        { text: 'No', style: 'cancel' },
                        { text: 'Yes', onPress: () => updateTodoStatus('OFFEN') },
                      ]
                    )
                  }
                >
                  <Icon name="times" size={16} color="#fff" style={styles.buttonIcon} />
                  <Text style={styles.statusButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
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
    color: '#28A745', // Green color to indicate completion
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginVertical: 10,
    borderWidth: 1,  // to avoid gray corners on android
    borderColor: '#fff',
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
    paddingRight: 70, // to avoid overlap with status badge
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
  expiresAt: {
    fontSize: 14,
    marginTop: 5,
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
  icon: {
    marginRight: 8,
    marginTop: 2,
  },
  detailText: {
    fontSize: 16,
    color: '#444',
    flex: 1,
    lineHeight: 20,
  },
  expiryRow: {
    alignItems: "center",
    marginTop: 10,
  },

  expiryTime: {
    fontSize: 16,
    fontWeight: "600",
  },

  expiryDate: {
    fontSize: 13,
    color: "#555",
    marginTop: 2,
  },

  expiryText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#DC2626', // subtle red
  },
  completedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  completedDate: {
    fontSize: 14,
    textAlign: "center",
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginTop: 14,
    paddingVertical: 6,
    borderTopWidth: 0.5,
    borderTopColor: "#ddd",
  },

  timeBlock: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 8,
  },

  timeHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },

  timeLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  timeMain: {
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 20,
  },
  timeSub: {
    fontSize: 13,
    color: "#777",
    marginTop: 2,
    textAlign: "center",
  },
  // ⏰ Zeitkritisch-Styles
timeCriticalCard: {
  borderLeftWidth: 4,
  //borderColor: '#FF6B6B', // Roter Rand
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
