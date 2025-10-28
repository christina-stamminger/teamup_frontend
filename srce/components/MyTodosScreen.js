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
import { useIsFocused, useFocusEffect } from '@react-navigation/native'; // for handling screen focus changes
import GroupListModal from '../components/GroupListModal'
import { getAvatarColor } from '../utils/getAvatarColor';
import Toast from 'react-native-toast-message'; // toast: for short messages intead of alert
import FilterBar from '../components/FilterBar';

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

  // displaying membersList in modal
  const [isMembersModalVisible, setIsMembersModalVisible] = useState(false);
  const toggleMembersModal = () => setIsMembersModalVisible(prev => !prev);


  // Memberslist: tap to expand and collapse
  const [membersExpanded, setMembersExpanded] = useState(false);

  // Add new member to list
  const extendedMembers = userRoleInGroup === 'ADMIN'
    ? [...newMembers, { type: 'addButton' }]
    : [...newMembers];


  // Filter options for filterBar
  // Define filter options
  const FILTER_OPTIONS = [
    { label: 'All', value: 'ALL' },
    { label: 'Open', value: 'OFFEN' },
    { label: 'In Progress', value: 'IN_ARBEIT' },
    { label: 'Completed', value: 'ERLEDIGT' },
    { label: 'Expired', value: 'ABGELAUFEN' },


  ];

  const [selectedFilters, setSelectedFilters] = useState(['ALL']);


  // GroupListData
  const groupListData = [...groups, { isCreateButton: true }];


  // Fetch groups on user change
  useEffect(() => { fetchGroups(); }, [userId]);

  // fetch groups on screen focus
  useFocusEffect(
    React.useCallback(() => {
      fetchGroups(); // lädt immer die aktuellen Gruppen
    }, [])
  );

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


  // Logic for using filterBar before fetching todos
  const filteredTodos = todos.filter(todo => {
    if (selectedFilters.includes('ALL')) return true;
    return selectedFilters.includes(todo.status?.toUpperCase());
  });


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
        Toast.show({
          type: 'info',
          text1: 'No todos available.',
          //text2: 'This is an info message with custom styles.',
          visibilityTime: 1500, //will be shown for 1 second
        });
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
    setIsAddMemberModalVisible(true);
  };

  // Swipe to delete - handleDeleteTodo
  const handleDeleteTodo = async (todoId) => {
    try {
      const token = await SecureStore.getItemAsync('authToken');

      const response = await fetch(`http://192.168.50.116:8082/api/todo/${todoId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete todo');
      }

      // If successful, update local state to remove the todo
      setTodos((prevTodos) => prevTodos.filter((todo) => todo.id !== id));

      // Optionally show a success message (toast, alert, etc.)
      alert('Todo deleted successfully!');
    } catch (error) {
      // Handle error (show an alert or toast message)
      alert('Error deleting todo: ' + error.message);
    }
  };

  const handleSelectFilter = (filterValue) => {
    if (filterValue === 'ALL') {
      setSelectedFilters(['ALL']);
    } else {
      setSelectedFilters(prev => {
        const updated = prev.includes(filterValue)
          ? prev.filter(f => f !== filterValue)
          : [...prev.filter(f => f !== 'ALL'), filterValue];
        return updated.length === 0 ? ['ALL'] : updated;
      });
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

      <View style={{ paddingVertical: 10 }}>
        <TouchableOpacity
          onPress={toggleGroupModal}
          style={styles.groupSelector}
        >
          <Text style={styles.groupSelectorText}>
            {selectedGroupName || 'Select Group'}
          </Text>
          <Icon name="chevron-down" size={16} color="gray" />
        </TouchableOpacity>
        <FilterBar
          filters={FILTER_OPTIONS}
          selectedFilters={selectedFilters}
          onSelectFilter={handleSelectFilter}
        />
      </View>


      {selectedGroupId && userRoleInGroup === 'ADMIN' && (
        <>
        </>
      )}

      <View style={styles.headerContainer}>

        <Text style={styles.headerTitle}>My Todos</Text>
      </View>

      <FlatList
        data={filteredTodos}
        keyExtractor={(item, index) => (item?.id ? item.id.toString() : index.toString())} // Check if id exists
        renderItem={({ item }) => (
          <View>

            <CollapsibleTodoCard
              todo={item}
              onStatusUpdated={() => fetchTodos(selectedGroupId)} // trigger re-fetch!
            />
          </View>
        )}
      />

      <GroupListModal
        isVisible={isGroupModalVisible}
        onClose={toggleGroupModal}
        groups={groups}
        selectedGroupId={selectedGroupId}
        onSelect={handleGroupSelect}
      />


      <Modal
        isVisible={isMembersModalVisible}
        onBackdropPress={toggleMembersModal}
        style={{ margin: 0, justifyContent: 'flex-end' }}
      >
        <View style={{
          backgroundColor: 'white',
          padding: 20,
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          maxHeight: '60%',
        }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>
            Group Members
          </Text>

          <FlatList
            data={extendedMembers}
            keyExtractor={(item, index) => item.userId ? item.userId.toString() : `addButton-${index}`}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            renderItem={({ item }) => {
              if (item.type === 'addButton') {
                return <AddMemberCard onPress={handleAddMember} />;
              }

              const isAdmin = item.role === 'ADMIN';
              return (
                <View style={styles.memberRow}>
                  <View style={styles.memberInfo}>
                    <View style={[
                      styles.avatarSmall,
                      { backgroundColor: getAvatarColor(item.username.charAt(0)) }
                    ]}>
                      <Text style={styles.avatarInitialMember}>
                        {item.username.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <Text style={[styles.memberName, isAdmin && styles.adminName]}>
                      {item.username}
                    </Text>
                    {isAdmin && (
                      <Icon name="shield" size={12} color="#FFD700" style={{ marginLeft: 4 }} />
                    )}
                  </View>

                  {userRoleInGroup === 'ADMIN' && (
                    <TouchableOpacity onPress={() => handleRemoveUser(item.userId)}>
                      <Icon name="trash" size={18} color="#FF5C5C" />
                    </TouchableOpacity>
                  )}
                </View>
              );
            }}
          />
        </View>
      </Modal>

    </View>
  );
}


// Your styles remain the same
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    //marginTop: 30,
    backgroundColor: '#F7F7F7',
  },
  groupButton: {
    backgroundColor: '#5fc9c9', //3cb1b1 #5FC9C9
    padding: 12,
    borderRadius: 5,
    marginBottom: 10,
    alignItems: 'center',
  },
  groupButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
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
    backgroundColor: '#E6F9F9', //E6F9F9
    borderRadius: 6,
  },
  newMembersTitle: {
    fontSize: 16,
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
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarSmall: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarSmallText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },


  memberName: {
    fontSize: 14,
    color: '#333',
  },
  adminName: {
    fontWeight: '700',
    color: '#000',
  },
  separator: {
    height: 1,
    backgroundColor: '#EEE',
    marginLeft: 44, // aligns with start of usernames
  },
  membersHeader: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },

  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  newMembersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'grey',
  },
  groupCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedGroupCard: {
    backgroundColor: '#DFF6F6',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },

  avatarInitialGroup: {
    color: 'white',
    fontSize: 20,
    textAlign: 'center',
  },
  avatarInitialMember: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
  },
  groupName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
  },

  createGroupCard: {
    backgroundColor: '#E6F9F9',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
    height: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  plusIcon: {
    fontSize: 40,
    fontWeight: '700',
    color: '#5FC9C9',
  },
  headerContainer: {
    marginBottom: 10,
    paddingHorizontal: 16,
    alignItems: 'center', // 🛠️ This centers the Text horizontally
  },
  headerTitle: {
    fontSize: 26, // ⬆️ Increased font size (was 22 before)
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center', // ⬅️ Also helps center text inside its block
  },
  avatarsRow: {
    flexDirection: 'row',
    marginTop: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },

  moreAvatar: {
    backgroundColor: '#ccc',
    marginLeft: -8,
    zIndex: 0,
  },


});

