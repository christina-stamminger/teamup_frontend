import React, { useState, useEffect } from 'react';
import { View, Text, Alert, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

import * as SecureStore from 'expo-secure-store';
import CollapsibleTodoCard from '../components/CollapsibleTodoCard';
import { useUser } from "../components/context/UserContext";
import Modal from 'react-native-modal';
import GroupCreationModal from "../components/GroupCreationModal";
import AddMemberCard from '../components/AddMemberCard'; // Import the new AddMemberCard


export default function MyTodosScreen() {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [selectedGroupName, setSelectedGroupName] = useState("Select Group");
  const [groups, setGroups] = useState([]);
  const [isGroupModalVisible, setIsGroupModalVisible] = useState(false);
  const [isCreationModalVisible, setIsCreationModalVisible] = useState(false);
  const { userId } = useUser();  // Extract userId from context

  const toggleGroupModal = () => {
    setIsGroupModalVisible(!isGroupModalVisible);
  };

  const toggleCreationModal = () => {
    setIsCreationModalVisible(!isCreationModalVisible);
  };

  const fetchGroups = async () => {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      console.log("Fetching groups for userId:", userId);  // Log userId for context
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
      console.log("Fetched groups data:", data);  // Log fetched groups data for debugging
      setGroups(data);
    } catch (error) {
      console.error('Error fetching groups:', error);
      Alert.alert('Error', 'Failed to fetch groups. Please try again.');
    }
  };

  useEffect(() => {
    fetchGroups();
  }, [userId]);

  useEffect(() => {
    if (!selectedGroupId) return;

    const fetchTodos = async () => {
      try {
        setLoading(true);
        const token = await SecureStore.getItemAsync('authToken');
        console.log("Fetching todos for groupId:", selectedGroupId, "userId:", userId);  // Log groupId and userId
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
        console.log("Fetched todos data:", data);  // Log fetched todos data for debugging

        // If response is empty or undefined, set todos to an empty array and show an alert
        if (!data || data.length === 0) {
          setTodos([]); // Set to an empty array if no todos exist
          Alert.alert('No todos available', 'There are no todos for this group yet.');
        } else {
          setTodos(data); // Set todos as fetched
        }
      } catch (error) {
        console.error('Error fetching todos:', error);
        Alert.alert('Error', 'Failed to fetch todos. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchTodos();
  }, [selectedGroupId]);

  const handleGroupCreated = (newGroup) => {
    // Update the group list and auto-select the new group
    console.log("Group created:", newGroup, "userId:", userId);  // Log the created group with userId for context
    setGroups((prevGroups) => [...prevGroups, newGroup]);
    setSelectedGroupId(newGroup.groupId);
    setSelectedGroupName(newGroup.groupName);
    setIsCreationModalVisible(false);
  };

  const handleGroupSelect = (groupId) => {
    const selectedGroup = groups.find(group => group.groupId === groupId);
    setSelectedGroupId(groupId);
    setSelectedGroupName(selectedGroup ? selectedGroup.groupName : "Select Group");
    setIsGroupModalVisible(false);
  };

  const handleAddMember = () => {
    // Logic to add a member, for now let's just show an alert
    Alert.alert("Add Member", "Here you can add a new member to the group.");
  };

  return (
    <View style={styles.container}>
      {/* Group Selector */}
      <TouchableOpacity onPress={toggleGroupModal} style={styles.groupButton}>
        <Text style={styles.groupButtonText}>{selectedGroupName}</Text>
      </TouchableOpacity>

          {/* Add Member Card */}
          {selectedGroupId && (
        <AddMemberCard onPress={handleAddMember} /> // Show the AddMemberCard if a group is selected
      )}



      {/* Todo List */}
      <FlatList
        data={todos}
        keyExtractor={(item, index) => (item.id ? item.id.toString() : index.toString())}
        renderItem={({ item }) => <CollapsibleTodoCard key={item.id} todo={item} />}
      />

      {/* Group Selection Modal */}
      <Modal isVisible={isGroupModalVisible} onBackdropPress={toggleGroupModal}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select a Group</Text>
          <FlatList
            data={groups}
            keyExtractor={(item, index) => item.groupId ? item.groupId.toString() : index.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
              style={[
                styles.groupItem,
                { backgroundColor: selectedGroupId === item.groupId ? '#5FC9C9' : 'transparent' },
              ]}
              onPress={() => handleGroupSelect(item.groupId)}
            >
              <View style={styles.iconAndTextContainer}>
                {/* Show an icon depending on the role */}
                <Icon
                  name={item.role === 'ADMIN' ? 'shield' : 'user'} // 'shield' for admins, 'user' for members
                  size={18} // Icon size
                  color={item.role === 'ADMIN' ? '#FFD700' : '#4A90E2'} // Different colors for admin and member
                  style={styles.icon}
                />
                <Text style={styles.groupItemText}>
                  {item.groupName}
                </Text>
              </View>
            </TouchableOpacity>
            
            )}
          />

        </View>
      </Modal>

      {/* Group Creation Modal */}
      <GroupCreationModal
        isVisible={isCreationModalVisible}
        toggleModal={toggleCreationModal}
        userId={userId}
        onGroupCreated={handleGroupCreated}
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
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  groupItem: {
    padding: 12,
    borderRadius: 5,
    marginVertical: 5,
    alignItems: 'center',
    flexDirection: 'row', // Ensures the icon and text are in a row
  },
  groupItemText: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
    marginLeft: 10, // Space between the icon and the text
  },
  iconAndTextContainer: {
    flexDirection: 'row',
    alignItems: 'center', // Align icon and text vertically
  },
  icon: {
    marginRight: 10, // Adds space between the icon and text
  },
  createGroupButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#5FC9C9',
    borderRadius: 5,
    alignItems: 'center',
  },
  createGroupButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
