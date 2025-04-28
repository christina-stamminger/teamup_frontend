import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useUser } from '../components/context/UserContext';
import { getStatusColor } from '../utils/statusHelpers';
import * as SecureStore from 'expo-secure-store';
import Icon from 'react-native-vector-icons/FontAwesome';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';

const CollapsibleTodoCard = ({ todo, onStatusUpdated }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { userId, loading } = useUser();

  const toggleExpand = () => setIsExpanded(!isExpanded);

  const statusColor = getStatusColor(todo.status);


  // Swipe to delete

  const updateTodoStatus = async (newStatus = 'In Arbeit') => {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      const currentTime = new Date().toISOString();  // Get the current time in ISO format

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
          completedAt: newStatus === 'Erledigt' ? currentTime : null,  // Only add completedAt if status is 'Completed'
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        alert(result.errorMessage || 'Fehler beim Aktualisieren des Todos.');
      } else {
        alert(result.message || 'Todo erfolgreich aktualisiert!');
        onStatusUpdated?.();
      }
    } catch (error) {
      console.error('Fehler beim Aktualisieren:', error);
      alert('Netzwerkfehler.');
    }
  };


  

  return (


        <TouchableOpacity style={[styles.card, { borderColor: statusColor }]} onPress={toggleExpand}>
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
              <Text style={styles.userLabel}>  Issuer:</Text>
              <Text style={styles.userValue}>
                {todo.username} {userId === todo.userOfferedId ? '(You)' : ''}
              </Text>
            </View>

            {todo.userTakenUsername && (
              <View style={styles.userRow}>
                <Icon name="check" size={16} color="#28a745" style={styles.icon} />
                <Text style={styles.userLabel}>Taken by:</Text>
                <Text style={styles.userValue}>
                  {todo.userTakenUsername} {userId === todo.userTakenId ? '(You)' : ''}
                </Text>
              </View>
            )}
          </View>
          {isExpanded && (
            <View style={styles.additionalContent}>

              {/* Bring it to - Icon Only */}
              <View style={styles.detailRow}>
                <MaterialCommunityIcons name="map-marker" size={18} color="#4B5563" style={styles.icon} />
                <Text style={styles.detailText}>{todo.location}</Text>
              </View>

              {/* Description - Icon Only */}
              <View style={styles.detailRow}>
                <Feather name="file-text" size={18} color="#4B5563" style={styles.icon} />
                <Text style={styles.detailText}>{todo.description}</Text>
              </View>

              {/* Additional Info - Icon Only */}
              <View style={styles.detailRow}>
                <Feather name="info" size={18} color="#4B5563" style={styles.icon} />
                <Text style={styles.detailText}>{todo.addInfo}</Text>
              </View>

              {!todo.userTakenId && (
                <Text style={styles.userTakenText}>No user has taken this task yet.</Text>
              )}

              <View style={styles.expiryRow}>
                <Text style={[styles.expiryText, { color: statusColor }]}>
                  Expires at: {todo.expiresAt}
                </Text>
              </View>

              {/* Show the completedAt field when status is "Completed" */}
              {todo.completedAt && (
                <View style={styles.completedRow}>
                  <Text style={[styles.completedText, { color: statusColor }]}>
                    Completed at: {todo.completedAt}
                  </Text>
                </View>
              )}

              {/* Take button if open */}
              {todo.status === 'Offen' && todo.userOfferedId !== userId && (
                <TouchableOpacity
                  style={styles.takeButton}
                  onPress={() => updateTodoStatus('In Arbeit')}
                >
                  <Text style={styles.takeButtonText}>I'll bring it</Text>
                </TouchableOpacity>
              )}

              {/* Fulfilled & Cancel buttons if already taken */}
              {todo.userTakenUsername && todo.userTakenId === userId && todo.status === 'In Arbeit' && (
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.statusButton, { backgroundColor: '#6BA8D1' }]}
                    onPress={() => updateTodoStatus('Erledigt')}
                  >
                    <Icon name="check" size={16} color="#fff" style={styles.buttonIcon} />
                    <Text style={styles.statusButtonText}>Completed</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.statusButton, { backgroundColor: '#F9A8B0' }]}
                    onPress={() =>
                      Alert.alert(
                        'Cancel',
                        'Do you want to give back todo?',
                        [
                          { text: 'No', style: 'cancel' },
                          { text: 'Yes', onPress: () => updateTodoStatus('Offen') },
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
   
  );
};

const styles = StyleSheet.create({
  // Existing styles...
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
    borderRadius: 10,
    padding: 15,
    marginVertical: 10,
    //borderWidth: 1,
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
    fontWeight: 'bold',
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
  addInfo: {
    fontSize: 14,
    color: '#777',
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
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 4,
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
  completedText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#28A745', // Green color to indicate completion
  },
  animatedCard: {
    marginBottom: 10,
  },


});

export default CollapsibleTodoCard;
