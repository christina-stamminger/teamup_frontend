import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet, Alert } from 'react-native';
import Modal from 'react-native-modal';
import * as SecureStore from 'expo-secure-store';

export default function GroupModal({ 
  isVisible, 
  toggleModal, 
  groups, 
  setGroups, 
  handleGroupSelect, 
  selectedGroupId, 
  userId 
}) {
  const [activeTab, setActiveTab] = useState('select'); // 'select' or 'create'
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState(''); // Added description field
  const [loading, setLoading] = useState(false);
  

  // Function to create a new group
  const handleCreateGroup = async () => {
    if (!groupName.trim() || !description.trim()) {
      Alert.alert('Error', 'Please enter both a group name and description.');
      return;
    }

    setLoading(true);
    try {
      const token = await SecureStore.getItemAsync('authToken');
      const response = await fetch('http://192.168.50.116:8082/api/groups/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          groupName: groupName.trim(),
          description: description.trim(), 
          userId: userId, // Send userId for backend to assign admin
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create group');
      }

      const newGroup = await response.json();
      console.log('Group created:', newGroup);

      // Update group list with the newly created group
      setGroups([...groups, newGroup]);

      // Automatically select the newly created group
      handleGroupSelect(newGroup.groupId);

      // Reset input fields and switch back to select tab
      setGroupName('');
      setDescription('');
      setActiveTab('select');
      toggleModal();

    } catch (error) {
      console.error('Error creating group:', error);
      Alert.alert('Error', 'Failed to create group. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isVisible={isVisible} onBackdropPress={toggleModal}>
      <View style={styles.modalContent}>
        
        {/* Tabs: Select Group / Create Group */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'select' && styles.activeTab]} 
            onPress={() => setActiveTab('select')}
          >
            <Text style={styles.tabText}>Select Group</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'create' && styles.activeTab]} 
            onPress={() => setActiveTab('create')}
          >
            <Text style={styles.tabText}>Create Group</Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'select' ? (
          /* Select Group List */
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
                <Text style={styles.groupItemText}>{item.groupName}</Text>
              </TouchableOpacity>
            )}
          />
        ) : (
          /* Create Group Form */
          <View style={styles.createGroupContainer}>
            <TextInput
              style={styles.input}
              placeholder="Enter group name"
              placeholderTextColor="#aaa"
              value={groupName}
              onChangeText={setGroupName}
            />
            <TextInput
              style={styles.input}
              placeholder="Enter group description"
              placeholderTextColor="#aaa"
              value={description}
              onChangeText={setDescription}
              multiline
            />
            <TouchableOpacity 
              style={styles.createButton} 
              onPress={handleCreateGroup}
              disabled={loading}
            >
              <Text style={styles.createButtonText}>{loading ? 'Creating...' : 'Create Group'}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    width: '100%',
    justifyContent: 'space-around',
  },
  tabButton: {
    paddingVertical: 10,
    flex: 1,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderColor: 'transparent',
  },
  activeTab: {
    borderColor: '#5FC9C9',
  },
  tabText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  groupItem: {
    padding: 12,
    borderRadius: 5,
    marginVertical: 5,
    alignItems: 'center',
  },
  groupItemText: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
  },
  createGroupContainer: {
    width: '100%',
    alignItems: 'center',
  },
  input: {
    width: '100%',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 10,
    fontSize: 16,
  },
  createButton: {
    backgroundColor: '#5FC9C9',
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
    width: '100%',
  },
  createButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
