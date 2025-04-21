import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useUser } from '../components/context/UserContext';
import { getStatusColor } from '../utils/statusHelpers';
import * as SecureStore from 'expo-secure-store';
import Icon from 'react-native-vector-icons/FontAwesome';

const CollapsibleTodoCard = ({ todo, onStatusUpdated }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { userId, loading } = useUser();

  const toggleExpand = () => setIsExpanded(!isExpanded);

  const statusColor = getStatusColor(todo.status);

  const updateTodoStatus = async (newStatus = 'In Arbeit') => {
    try {
      const token = await SecureStore.getItemAsync('authToken');

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

  if (loading) {
    return <Text>Loading...</Text>;
  }

  return (
    <TouchableOpacity style={[styles.card, { borderColor: statusColor }]} onPress={toggleExpand}>
      {/* Title */}
      <Text style={styles.title}>{todo.title}</Text>

      <View style={styles.userBlock}>
        <View style={styles.userRow}>
          <Icon name="user" size={16} color="#666" style={styles.icon} />
          <Text style={styles.userLabel}>Issuer:</Text>
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
          <Text style={styles.description}>Description: {todo.description}</Text>
          <Text style={styles.addInfo}>Additional Info: {todo.addInfo}</Text>

          {!todo.userTakenId && (
            <Text style={styles.userTakenText}>No user has taken this task yet.</Text>
          )}


          {/* Moved expiresAt and status below */}
          <Text style={[styles.expiresAt, { color: statusColor }]}>
            Expires at: {todo.expiresAt}
          </Text>
          <Text style={[styles.status, { color: statusColor }]}>
            Status: {todo.status}
          </Text>

          {/* Take button if open */}
          {todo.status === 'Offen' && todo.userOfferedId !== userId && (
            <TouchableOpacity
              style={styles.takeButton}
              onPress={() => updateTodoStatus('In Arbeit')}
            >
              <Text style={styles.takeButtonText}>I'll do it</Text>
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
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginVertical: 10,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
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
    color: '#666',
    fontWeight: '500',
    marginRight: 4,
  },
  userValue: {
    fontSize: 14,
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
    color: '#333',
    marginBottom: 10,
  },
  expiresAt: {
    fontSize: 14,
    marginTop: 5,
  },
  status: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 3,
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
});

export default CollapsibleTodoCard;
