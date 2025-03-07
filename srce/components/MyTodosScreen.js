import React, { useState, useEffect } from 'react';
import { View, Text, Alert, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import CollapsibleTodoCard from '../components/CollapsibleTodoCard'; 
import { useUser } from "../components/context/UserContext";
import GroupModal from '../components/GroupModal';

export default function MyTodosScreen() {
  const [todos, setTodos] = useState([]);  
  const [loading, setLoading] = useState(true);  
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [selectedGroupName, setSelectedGroupName] = useState("Select Group"); // Default text
  const [groups, setGroups] = useState([]);  
  const [isModalVisible, setIsModalVisible] = useState(false);  
  const { userId } = useUser();

  const toggleModal = () => {
    setIsModalVisible(!isModalVisible);
  };

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const token = await SecureStore.getItemAsync('authToken');
        const response = await fetch(`http://192.168.50.116:8082/api/groups/myGroups`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch groups');
        }

        const data = await response.json();
        setGroups(data);
      } catch (error) {
        console.error('Error fetching groups:', error);
        Alert.alert('Error', 'Failed to fetch groups. Please try again.');
      }
    };

    fetchGroups();
  }, [userId]);

  useEffect(() => {
    if (!selectedGroupId) return; 

    const fetchTodos = async () => {
      try {
        setLoading(true);
        const token = await SecureStore.getItemAsync('authToken');
        const response = await fetch(`http://192.168.50.116:8082/api/todo/group/${selectedGroupId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch todos');
        }

        const data = await response.json();
        setTodos(data);
      } catch (error) {
        console.error('Error fetching todos:', error);
        Alert.alert('Error', 'Failed to fetch todos. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchTodos();
  }, [selectedGroupId]);

  const handleGroupSelect = (groupId) => {
    const selectedGroup = groups.find(group => group.groupId === groupId);
    setSelectedGroupId(groupId);
    setSelectedGroupName(selectedGroup ? selectedGroup.groupName : "Select Group");
    setIsModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={toggleModal} style={styles.groupButton}>
        <Text style={styles.groupButtonText}>{selectedGroupName}</Text>
      </TouchableOpacity>

      <FlatList
        data={todos}
        keyExtractor={(item, index) => (item.id ? item.id.toString() : index.toString())}
        renderItem={({ item }) => <CollapsibleTodoCard key={item.id} todo={item} />}
      />

      <GroupModal
        isVisible={isModalVisible}
        toggleModal={toggleModal}
        groups={groups}
        handleGroupSelect={handleGroupSelect}
        selectedGroupId={selectedGroupId}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    marginTop: 30,
    backgroundColor: '#F7F7F7',
  },
  groupButton: {
    backgroundColor: '#5FC9C9',
    padding: 12,
    borderRadius: 5,
    marginBottom: 10,
    alignItems: 'center',
  },
  groupButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
