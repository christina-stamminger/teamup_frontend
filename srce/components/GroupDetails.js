import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Button,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AddMemberModal from './AddMemberModal';
import Icon from 'react-native-vector-icons/FontAwesome';
import AddMemberCard from './AddMemberCard';
import { useUser } from '../components/context/UserContext';
import { getAvatarColor }  from '../utils/getAvatarColor';


export default function GroupDetails({ route, navigation }) {
  const { group } = route.params;
  const { user } = useUser(); // ✅ Fix: get full user object

  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddMemberModalVisible, setIsAddMemberModalVisible] = useState(false);

  const isUserAdmin = group?.role === 'ADMIN';

  const fetchNewMembers = async (groupId) => {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      const response = await fetch(
        `http://192.168.50.116:8082/api/groups/${groupId}/members`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      if (!response.ok) throw new Error('Failed to fetch new members');
      const data = await response.json();
      setMembers(data);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching new members:', error);
      Alert.alert('Error', 'Failed to fetch new members.');
    }
  };

  useEffect(() => {
    if (group?.groupId) {
      fetchNewMembers(group.groupId);
    }
  }, [group]);

  const handleAddMember = () => {
    setIsAddMemberModalVisible(true);
  };

  const handleRemoveUser = async (userIdToRemove) => {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      const response = await fetch(
        `http://192.168.50.116:8082/api/groups/removeUser?userId=${userIdToRemove}&groupId=${group.groupId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) throw new Error('Failed to remove user');

      fetchNewMembers(group.groupId);
      Alert.alert('Success', 'User removed from the group.');
    } catch (error) {
      console.error('Error removing user:', error);
      Alert.alert('Error', 'Could not remove user from the group.');
    }
  };

  const extendedMembers = isUserAdmin
    ? [...members, { type: 'addButton' }]
    : [...members];


  return (
    <View style={styles.container}>
      {/* Group Header */}
      <View style={styles.groupHeader}>
        <View
          style={[
            styles.avatar,
            { backgroundColor: '#e0e0e0' }, // static grey background

          ]}
        >
          <Text style={styles.avatarText}>
            {group.groupName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.groupName}>{group.groupName}</Text>
      </View>
    

      {/* Members List */}
      {isLoading ? (
        <Text>Loading members...</Text>
      ) : (
        <FlatList
          data={extendedMembers}
          keyExtractor={(item, index) =>
            item.userId ? item.userId.toString() : `addButton-${index}`
          }
          renderItem={({ item }) => {
            if (item.type === 'addButton') {
                return (
                  <TouchableOpacity style={styles.memberCard} onPress={handleAddMember}>
                    <View style={[styles.avatarGridItem, styles.addAvatar]}>
                      <Icon name="plus" size={18} color="#00ACC1" />
                    </View>
                  </TouchableOpacity>
                );
              }
              

            const isAdmin = item.role === 'ADMIN';
            const isNotSelf = item.userId !== user?.id;

            return (
              <View style={styles.memberRow}>
                <View style={styles.memberInfo}>
                  <View
                    style={[
                      styles.avatarSmall,
                      {
                        backgroundColor: getAvatarColor(
                          item.username.charAt(0)
                        ),
                      },
                    ]}
                  >
                    <Text style={styles.avatarInitialMember}>
                      {item.username.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Text
                    style={[styles.memberName, isAdmin && styles.adminName]}
                  >
                    {item.username}
                  </Text>
                  {isAdmin && (
                    <Icon
                      name="shield"
                      size={12}
                      color="#FFD700"
                      style={{ marginLeft: 4 }}
                    />
                  )}
                </View>
                {isUserAdmin && isNotSelf && (
                  <TouchableOpacity
                    onPress={() => handleRemoveUser(item.userId)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Icon name="trash" size={18} color="#FF5C5C" />
                  </TouchableOpacity>
                )}
              </View>
            );
          }}
        />
      )}

      {/* Add Member Modal */}
      {isAddMemberModalVisible && (
        <AddMemberModal
          isVisible={isAddMemberModalVisible}
          groupId={group.groupId}
          onClose={() => setIsAddMemberModalVisible(false)}
          onMemberAdded={() => fetchNewMembers(group.groupId)}
        />
      )}

      {/* Bottom Back Button */}
      <TouchableOpacity
        style={styles.backButtonBottom}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>Back to My Groups</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  groupHeader: {
    alignItems: 'center',
    marginTop: 100,
    marginBottom: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    color: '#333',
  },
  groupName: {
    fontSize: 22,
    color: '#333',
  },
  memberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#fff',
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarInitialMember: {
    color: '#fff',
    fontWeight: 'bold',
  },
  memberName: {
    fontSize: 16,
    color: '#333',
  },
  adminName: {
    fontWeight: 'bold',
    color: '#5FC9C9',
  },
  avatarGridItem: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  addAvatar: {
    backgroundColor: '#E0F7FA',         // Light teal background for "add"
    borderColor: '#00ACC1',    
    marginTop: 10,         // Teal border
  },
  backButtonBottom: {
    marginBottom: 20,
    padding: 12,
    backgroundColor: '#5FC9C9',
    alignItems: 'center',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});
