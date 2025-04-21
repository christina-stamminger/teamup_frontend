import React, { useState, useEffect } from 'react';
import { View, Text, Alert, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import * as SecureStore from 'expo-secure-store';
import CollapsibleTodoCard from '../components/CollapsibleTodoCard';
import { useUser } from "../components/context/UserContext";
import Modal from 'react-native-modal';
import GroupCreationModal from "../components/GroupCreationModal";
import AddMemberCard from '../components/AddMemberCard';
import AddMemberModal from '../components/AddMemberModal';
import { useIsFocused } from '@react-navigation/native'; // for handling screen focus changes

// ... all your imports remain the same

export default function MyTodosScreen() {
  const [todos, setTodos] = useState([]);
  const [newMembers, setNewMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [selectedGroupName, setSelectedGroupName] = useState("Select Group");
  const [groups, setGroups] = useState([]);
  const [userRoleInGroup, setUserRoleInGroup] = useState(null);
  const [isGroupModalVisible, setIsGroupModalVisible] = useState(false);
  const [isCreationModalVisible, setIsCreationModalVisible] = useState(false);
  const [isAddMemberModalVisible, setIsAddMemberModalVisible] = useState(false);
  const { userId } = useUser();

  const toggleGroupModal = () => setIsGroupModalVisible(prev => !prev);
  const toggleCreationModal = () => setIsCreationModalVisible(prev => !prev);

  // Fetch groups on user change
  useEffect(() => { fetchGroups(); }, [userId]);

  // Fetch todos - screen focus changes 
  const isFocused = useIsFocused(); // isFocused becomes true when screen is active

  useEffect(() => {
    if (isFocused && selectedGroupId) {
      fetchTodos(selectedGroupId);
      fetchNewMembers(selectedGroupId); // if a group is selected, we refetch todos and members
    }
  }, [isFocused]);


  const fetchGroups = async () => {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      const response = await fetch(`http://192.168.50.116:8082/api/groups/myGroups`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Failed to fetch groups');
      const data = await response.json();
      setGroups(data);
    } catch (error) {
      console.error('Error fetching groups:', error);
      Alert.alert('Error', 'Failed to fetch groups.');
    }
  };

  const fetchTodos = async (groupId) => {
    console.log("Calling fetchTodos with groupId:", groupId);
  
    try {
      setLoading(true);
      const token = await SecureStore.getItemAsync('authToken');
      const response = await fetch(`http://192.168.50.116:8082/api/todo/group/${groupId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
  
      if (!response.ok) throw new Error('Failed to fetch todos');
  
      const data = await response.json();
      console.log("Fetched todos:", data);
  
      // ✅ Filter for MyTodosScreen (user-created or taken, but not given back)
      const filtered = data.filter(todo =>
        (todo.userOfferedId === userId || todo.userTakenId === userId) &&
        (todo.status !== 'Offen' || todo.userOfferedId === userId)
      );
  
      console.log("Filtered todos (MyTodos):", filtered);
      setTodos(filtered);
  
      if (filtered.length === 0) {
        Alert.alert('No todos available', 'There are no relevant todos for you in this group yet.');
      }
    } catch (error) {
      console.error('Error fetching todos:', error);
      Alert.alert('Error', 'Failed to fetch todos.');
    } finally {
      setLoading(false);
    }
  };
  

  const fetchNewMembers = async (groupId) => {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      const response = await fetch(`http://192.168.50.116:8082/api/groups/${groupId}/members`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Failed to fetch new members');
      const data = await response.json();
      setNewMembers(data);
      console.log("Members fetched:", data);

    } catch (error) {
      console.error('Error fetching new members:', error);
      Alert.alert('Error', 'Failed to fetch new members.');
    }
  };

  const handleGroupCreated = (newGroup) => {
    setGroups(prev => [...prev, newGroup]);
    setSelectedGroupId(newGroup.groupId);
    setSelectedGroupName(newGroup.groupName);
    setUserRoleInGroup(newGroup.role);
    setIsCreationModalVisible(false);
  };

  const handleGroupSelect = (groupId) => {
    const selectedGroup = groups.find(g => g.groupId === groupId);
    if (selectedGroup) {
      setSelectedGroupId(groupId);
      setSelectedGroupName(selectedGroup.groupName);
      setUserRoleInGroup(selectedGroup.role);
      setIsGroupModalVisible(false);
      fetchTodos(groupId);         // ✅ fetch todos
      fetchNewMembers(groupId);    // ✅ fetch new members
    }
  };

  const handleAddMember = () => {
    if (userRoleInGroup === 'ADMIN') {
      setIsAddMemberModalVisible(true);
    } else {
      Alert.alert('Permission Denied', 'You must be an admin to add members.');
    }
  };

  const handleRemoveUser = async (userIdToRemove) => {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      const response = await fetch(
        `http://192.168.50.116:8082/api/groups/removeUser?userId=${userIdToRemove}&groupId=${selectedGroupId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) throw new Error('Failed to remove user');

      fetchNewMembers(selectedGroupId); // refresh members list
      Alert.alert('Success', 'User removed from the group.');
    } catch (error) {
      console.error('Error removing user:', error);
      Alert.alert('Error', 'Could not remove user from the group.');
    }
  };



  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={toggleGroupModal} style={styles.groupButton}>
        <Text style={styles.groupButtonText}>{selectedGroupName}</Text>
      </TouchableOpacity>

      {selectedGroupId && userRoleInGroup === 'ADMIN' && (
        <>
          <AddMemberCard onPress={handleAddMember} />
        </>
      )}


      {newMembers.length > 0 && (
        <View style={styles.newMembersContainer}>
          <Text style={styles.newMembersTitle}>Members</Text>
          <FlatList
            data={newMembers}
            keyExtractor={(item) => item.userId.toString()}
            renderItem={({ item }) => {
              const isAdmin = item.role === 'ADMIN';
              return (
                <View style={styles.memberItemRow}>
                  <View style={styles.iconAndTextContainer}>
                    {isAdmin && (
                      <Icon
                        name="shield"
                        size={16}
                        color="#FFD700"
                        style={{ marginRight: 6 }}
                      />
                    )}
                    <Text style={[styles.memberText, isAdmin && { fontWeight: 'bold' }]}>
                      {item.username}
                    </Text>
                  </View>
                  {userRoleInGroup === 'ADMIN' && (
                    <TouchableOpacity onPress={() => handleRemoveUser(item.userId)}>
                      <Icon name="trash" size={20} color="#FF5C5C" />
                    </TouchableOpacity>
                  )}
                </View>
              );
            }}
          />
        </View>
      )}



      <FlatList
        data={todos}
        keyExtractor={(item, index) => (item.id ? item.id.toString() : index.toString())}
        renderItem={({ item }) => (
          <CollapsibleTodoCard
            key={item.id}
            todo={item}
            onStatusUpdated={() => fetchTodos(selectedGroupId)} // trigger re-fetch!
          />
        )}
      />


      <Modal isVisible={isGroupModalVisible} onBackdropPress={toggleGroupModal}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select a Group</Text>
          <FlatList
            data={groups}
            keyExtractor={(item) => item.groupId.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.groupItem,
                  { backgroundColor: selectedGroupId === item.groupId ? '#5FC9C9' : 'transparent' },
                ]}
                onPress={() => handleGroupSelect(item.groupId)}
              >
                <View style={styles.iconAndTextContainer}>
                  <Icon
                    name={item.role === 'ADMIN' ? 'shield' : 'user'}
                    size={18}
                    color={item.role === 'ADMIN' ? '#FFD700' : '#4A90E2'}
                    style={styles.icon}
                  />
                  <Text style={styles.groupItemText}>{item.groupName}</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>

      <GroupCreationModal
        isVisible={isCreationModalVisible}
        toggleModal={toggleCreationModal}
        userId={userId}
        onGroupCreated={handleGroupCreated}
      />

      <AddMemberModal
        isVisible={isAddMemberModalVisible}
        onClose={() => setIsAddMemberModalVisible(false)}
        groupId={selectedGroupId}
        onMemberAdded={() => fetchNewMembers(selectedGroupId)}
      />
    </View>
  );
}

// Your styles remain the same
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
    flexDirection: 'row',
  },
  groupItemText: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
    marginLeft: 10,
  },
  iconAndTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 10,
  },
  newMembersContainer: {
    marginVertical: 10,
    padding: 10,
    backgroundColor: '#E6F9F9',
    borderRadius: 6,
  },
  newMembersTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  memberItem: {
    paddingVertical: 4,
  },
  memberText: {
    fontSize: 14,
    color: '#333',
  },
  memberItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  adminHighlight: {
    backgroundColor: '#FFF8DC', // Light yellow to highlight admin
    borderRadius: 6,
    paddingHorizontal: 8,
  },

  adminText: {
    fontWeight: 'bold',
    color: '#DAA520', // GoldenRod
  },


}); 