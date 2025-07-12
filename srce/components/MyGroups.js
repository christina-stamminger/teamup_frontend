import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Dimensions, Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useUser } from './context/UserContext';
import GroupCreationModal from './GroupCreationModal'; // Import the modal component
import { useNavigation } from '@react-navigation/native'; // Import useNavigation for navigation
import Icon from 'react-native-vector-icons/FontAwesome';

export default function MyGroups({ selectedGroupId, onGroupSelect, onCreatePress }) {
    const [groups, setGroups] = useState([]);
    const { userId } = useUser();
    const navigation = useNavigation(); // To navigate to the next screen


    const [isCreationModalVisible, setIsCreationModalVisible] = useState(false);

    const toggleCreationModal = () => setIsCreationModalVisible(prev => !prev);

    useEffect(() => {
        if (userId) fetchGroups();
    }, [userId]);

    const fetchGroups = async () => {
        try {
            const token = await SecureStore.getItemAsync('authToken');
            const response = await fetch(`http://192.168.50.116:8082/api/groups/myGroups`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            if (!response.ok) throw new Error('Failed to fetch groups');
            const data = await response.json();
            setGroups(data);
            console.log("Fetched groups:", data);

        } catch (error) {
            console.error('Error fetching groups:', error);
            Alert.alert('Error', 'Could not fetch your groups.');

        }
    };

    const handleGroupCreated = (newGroup) => {
        setGroups(prev => [...prev, newGroup]);
        setIsCreationModalVisible(false);
    };

    const groupListData = [...groups, { isCreateButton: true }];

    // Handle the selection of a group
    const handleGroupSelect = (groupId) => {
        const selectedGroup = groups.find(group => group.groupId === groupId); // Find the selected group
        navigation.navigate('GroupDetails', { group: selectedGroup }); // Navigate to GroupDetailsScreen with selected group data
    };

    return (
        <View style={{ flex: 1, marginTop: 30, alignItems: 'center' }}>
        

            <FlatList
                data={groupListData}
                keyExtractor={(item, index) => item.groupId ? item.groupId.toString() : `create-${index}`}
                numColumns={3} // This ensures 3 items per row
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                    paddingHorizontal: 15, // Ensure there is padding on both sides to center the items
                    paddingTop: 10, // Optional: Add some padding at the top
                    alignItems: 'center', // Center items horizontally
                }}
                renderItem={({ item }) => {
                    if (item.isCreateButton) {
                        return (
                            <TouchableOpacity
                                style={styles.createGroupCard}
                                onPress={toggleCreationModal} // your modal toggle function
                            >
                                <Icon name="plus" size={14} color="#5fc9c9" />
                            </TouchableOpacity>
                        );
                    } else {
                        return (
                            <TouchableOpacity
                                style={[
                                    styles.groupCard,
                                    selectedGroupId === item.groupId && styles.selectedGroupCard,
                                ]}
                                onPress={() => handleGroupSelect(item.groupId)}
                            >
                                <View style={[styles.avatar, styles.groupAvatar, { backgroundColor: '#e0e0e0' }]}>
                                    <Text style={styles.avatarInitialGroup}>
                                        {item.groupName.charAt(0).toUpperCase()}
                                    </Text>
                                </View>
                                <Text style={styles.groupName} numberOfLines={1}>
                                    {item.groupName}
                                </Text>
                            </TouchableOpacity>
                        );
                    }
                }}
                ItemSeparatorComponent={() => <View style={{ width: 10 }} />} // Add space between rows
            />

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
    groupCard: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 10,
        paddingTop: 10,
        margin: 15,  // Adjust spacing between cards
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 1 },
        shadowRadius: 3,
        width: 100,  // Fixed width for each card
        height: 100,
    },
    selectedGroupCard: {
        borderColor: '#5fc9c9',
        borderWidth: 2,
    },
    avatar: {
        backgroundColor: '#e0e0e0',
        width: 60,
        height: 60,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    avatarInitialGroup: {
        fontSize: 20,
        color: '#000',
    },
    groupName: {
        fontSize: 13,
        textAlign: 'center',
        color: '#333',
    },
    createGroupCard: {
        backgroundColor: '#E0F7FA',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 10,
        margin: 15,  // Adjust margin
        height: 100,
        width: 100,  // Fixed width for the "+" card
    },
    plusIcon: {
        fontSize: 38,
        color: '#00ACC1',
        fontWeight: 'bold',
    },
});
