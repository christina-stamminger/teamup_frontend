import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Dimensions, Alert, Pressable } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useUser } from './context/UserContext';
import GroupCreationModal from './GroupCreationModal';
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import Icon from 'react-native-vector-icons/FontAwesome';
import { Modal } from "react-native";
import Toast from "react-native-toast-message";
import { useNetwork } from "../components/context/NetworkContext"; // ✅ safeFetch importiert
import { API_URL } from "../config/env";


export default function MyGroups({ selectedGroupId, onGroupSelect, onCreatePress }) {
    const [groups, setGroups] = useState([]);
    const { userId } = useUser();
    const navigation = useNavigation();
    const { safeFetch } = useNetwork(); // ✅ Zugriff auf safeFetch

    const [isCreationModalVisible, setIsCreationModalVisible] = useState(false);
    //const toggleCreationModal = () => setIsCreationModalVisible(prev => !prev);

    const openCreationModal = () => setIsCreationModalVisible(true);
    const closeCreationModal = () => setIsCreationModalVisible(false);


    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
    const [selectedGroupForDelete, setSelectedGroupForDelete] = useState(null);

    const screenWidth = Dimensions.get('window').width;
    const numColumns = 3;
    const horizontalPadding = 10;
    const cardMargin = 12;
    const availableWidth = screenWidth - (horizontalPadding * 2);
    const totalMarginSpace = cardMargin * (numColumns + 1);
    const cardWidth = (availableWidth - totalMarginSpace) / numColumns;

    // ✅ Gruppen abrufen mit safeFetch
    // ✅ Gruppen abrufen mit safeFetch
    const fetchGroups = useCallback(async () => {
        try {
            const token = await SecureStore.getItemAsync("accessToken");

            const response = await safeFetch(`${API_URL}/api/groups/myGroups`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (response?.offline) {
                Toast.show({
                    type: 'info',
                    text1: 'Offline',
                    text2: 'Keine Internetverbindung',
                });
                return;
            }

            if (!response.ok) {
                throw new Error("Fehler beim Abrufen der Gruppen");
            }

            const data = await response.json();
            setGroups(data);
            console.log("📦 Gruppen geladen:", data);

        } catch (error) {
            console.error("Fehler beim Laden der Gruppen:", error);

            Toast.show({
                type: 'error',
                text1: 'Gruppen konnten nicht geladen werden',
                text2: error.message || 'Unbekannter Fehler',
            });
        }
    }, [safeFetch]);

    useFocusEffect(
        useCallback(() => {
            if (userId) {
                fetchGroups();
            }
        }, [userId, fetchGroups])
    );

    const handleGroupCreated = (newGroup) => {
        setGroups(prev => [...prev, newGroup]);
        setIsCreationModalVisible(false);
    };

    const groupListData = [...groups, { isCreateButton: true }];

    const handleGroupSelect = (groupId) => {
        const selectedGroup = groups.find(group => group.groupId === groupId);
        navigation.navigate('GroupDetails', { group: selectedGroup });
    };

    const handleGroupLongPress = (group) => {
        if (group.role !== "ADMIN") return;
        setSelectedGroupForDelete(group);
        setIsDeleteModalVisible(true);
    };

    // ✅ Gruppendeletion mit safeFetch
    const handleDeleteGroup = async () => {
        try {
            // 🟨 Check Todos
            const checkResponse = await safeFetch(
                `${API_URL}/api/groups/${selectedGroupForDelete.groupId}/checkTodos`
            );

            if (checkResponse?.offline) {
                Alert.alert("Offline", "Keine Internetverbindung.");
                return;
            }

            if (!checkResponse?.ok) {
                throw new Error(`CheckTodos failed (${checkResponse?.status})`);
            }

            const checkData = await checkResponse.json();

            if (checkData.hasOpenTodos) {
                Alert.alert(
                    "Löschen nicht möglich",
                    "In dieser Gruppe gibt es noch offene oder in Arbeit befindliche Todos. Bitte schließe sie zuerst."
                );
                setIsDeleteModalVisible(false);
                return;
            }

            // 🟥 Gruppe löschen
            const deleteResponse = await safeFetch(
                `${API_URL}/api/groups/${selectedGroupForDelete.groupId}/delete`,
                { method: "DELETE" }
            );

            if (deleteResponse?.offline) {
                Alert.alert("Offline", "Keine Internetverbindung.");
                return;
            }

            if (!deleteResponse?.ok) {
                throw new Error(`Delete group failed (${deleteResponse?.status})`);
            }

            Toast.show({
                type: "success",
                text1: "Gruppe erfolgreich gelöscht",
                visibilityTime: 2000,
            });

            setIsDeleteModalVisible(false);
            fetchGroups();

        } catch (error) {
            console.error("Fehler beim Löschen der Gruppe:", error);
            Alert.alert("Fehler", "Die Gruppe konnte nicht gelöscht werden.");
        }
    };


    return (
        <View style={{ flex: 1, marginTop: 30 }}>
            <View style={styles.headerContainer}>
                <Text style={styles.headerTitle}>Meine Gruppen</Text>
            </View>

            <FlatList
                data={groupListData}
                numColumns={numColumns}
                keyExtractor={(item, index) =>
                    item.groupId ? item.groupId.toString() : `create-${index}`
                }
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                    paddingHorizontal: horizontalPadding,
                    paddingTop: 10,
                    paddingBottom: 20,
                }}
                columnWrapperStyle={{
                    justifyContent: 'flex-start',
                    alignItems: 'stretch',
                }}
                renderItem={({ item }) => {
                    if (item.isCreateButton) {
                        return (
                            <Pressable
                                onPress={openCreationModal}
                                style={({ pressed }) => [
                                    styles.groupCard,
                                    styles.createGroupCard,
                                    {
                                        width: cardWidth,
                                        marginHorizontal: cardMargin / 2,
                                        marginVertical: cardMargin / 2,
                                        opacity: pressed ? 0.6 : 1,
                                    },
                                ]}
                            >
                                <Icon name="plus" size={32} color="#4FB6B8" />
                            </Pressable>

                        );
                    }

                    const isAdmin = item.role === "ADMIN";

                    return (
                        <TouchableOpacity
                            style={[styles.groupCard, {
                                width: cardWidth,
                                marginHorizontal: cardMargin / 2,
                                marginVertical: cardMargin / 2,
                            }]}
                            onPress={() => handleGroupSelect(item.groupId)}
                            onLongPress={() => handleGroupLongPress(item)}
                            delayLongPress={400}
                        >
                            <View style={[styles.avatar, { backgroundColor: "#e0e0e0" }]}>
                                <Text style={styles.avatarInitialGroup}>
                                    {item.groupName.charAt(0).toUpperCase()}
                                </Text>

                                {isAdmin && (
                                    <View style={styles.adminBadge}>
                                        <Icon name="shield" size={16} color="#FFD700" />
                                    </View>
                                )}
                            </View>

                            <Text style={styles.groupName} numberOfLines={1}>
                                {item.groupName}
                            </Text>
                        </TouchableOpacity>
                    );
                }}
            />

            <GroupCreationModal
                isVisible={isCreationModalVisible}
                onClose={closeCreationModal}   // ✅ richtig
                userId={userId}
                onGroupCreated={handleGroupCreated}
            />


            <Modal
                visible={isDeleteModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setIsDeleteModalVisible(false)} // Android Back
            >
                <View style={styles.overlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Gruppe verwalten</Text>
                        <Text style={styles.modalText}>
                            Möchtest du die Gruppe "{selectedGroupForDelete?.groupName}" wirklich löschen?
                        </Text>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setIsDeleteModalVisible(false)}
                            >
                                <Text style={styles.modalButtonText}>Abbrechen</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.modalButton, styles.confirmButton]}
                                onPress={handleDeleteGroup}
                            >
                                <Text style={[styles.modalButtonText, { color: "white" }]}>
                                    Löschen
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    groupCard: {
        backgroundColor: "#fff",
        borderRadius: 10,
        paddingTop: 15,
        paddingHorizontal: 5,
        paddingBottom: 10,
        alignItems: "center",
        justifyContent: "center",
        elevation: 2,
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 1 },
        shadowRadius: 3,
        height: 100,
    },
    createGroupCard: {
        backgroundColor: "#E6F4F4",
        borderColor: "#E6F4F4",
        borderWidth: 1, // sonst graue Ecken bei android!!
    },
    selectedGroupCard: {
        borderColor: '#4FB6B8',
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
    plusIcon: {
        fontSize: 38,
        color: '#00ACC1',
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    adminBadgeAvatar: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 2,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 1 },
        shadowRadius: 1,
    },
    adminBadge: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 3,
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowOffset: { width: 0, height: 1 },
        shadowRadius: 2,
    },
    modalContent: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
        marginBottom: 10,
        textAlign: 'center',
    },
    modalText: {
        fontSize: 15,
        color: '#555',
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 20,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    modalButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginHorizontal: 5,
    },
    cancelButton: {
        backgroundColor: '#E0E0E0',
    },
    confirmButton: {
        backgroundColor: '#4FB6B8',
    },
    modalButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    headerTitle: {
        marginTop: 20,
        fontSize: 26,
        color: '#333',
        textAlign: 'center', // ⬅️ Also helps center text inside its block
    },
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
    },

});