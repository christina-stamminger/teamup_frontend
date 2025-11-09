import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Dimensions, Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useUser } from './context/UserContext';
import GroupCreationModal from './GroupCreationModal';
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import Icon from 'react-native-vector-icons/FontAwesome';
import Modal from "react-native-modal";
import Toast from "react-native-toast-message";
import { useNetwork } from "../components/context/NetworkContext"; // ✅ safeFetch importiert

export default function MyGroups({ selectedGroupId, onGroupSelect, onCreatePress }) {
    const [groups, setGroups] = useState([]);
    const { userId } = useUser();
    const navigation = useNavigation();
    const { safeFetch } = useNetwork(); // ✅ Zugriff auf safeFetch

    const [isCreationModalVisible, setIsCreationModalVisible] = useState(false);
    const toggleCreationModal = () => setIsCreationModalVisible(prev => !prev);

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
    const fetchGroups = useCallback(async () => {
        try {
            const token = await SecureStore.getItemAsync("authToken");
            const response = await safeFetch(`http://192.168.50.116:8082/api/groups/myGroups`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (response.offline) {
                Alert.alert("Offline", "Keine Internetverbindung.");
                return;
            }

            if (!response.ok) throw new Error("Fehler beim Abrufen der Gruppen");

            const data = await response.json();
            setGroups(data);
            console.log("📦 Gruppen geladen:", data);
        } catch (error) {
            console.error("Fehler beim Laden der Gruppen:", error);
            Alert.alert("Fehler", "Deine Gruppen konnten nicht geladen werden.");
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
            const token = await SecureStore.getItemAsync("authToken");
            if (!token) {
                Alert.alert("Fehler", "Kein Token gefunden. Bitte erneut anmelden.");
                return;
            }

            // 🟨 CheckTodos
            const checkResponse = await safeFetch(
                `http://192.168.50.116:8082/api/groups/${selectedGroupForDelete.groupId}/checkTodos`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (checkResponse.offline) {
                Alert.alert("Offline", "Keine Internetverbindung.");
                return;
            }

            if (!checkResponse.ok) {
                const text = await checkResponse.text?.();
                console.log("Fehler bei CheckTodos:", text);
                throw new Error("Fehler beim Überprüfen der offenen Todos");
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
                `http://192.168.50.116:8082/api/groups/${selectedGroupForDelete.groupId}/delete`,
                {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (deleteResponse.offline) {
                Alert.alert("Offline", "Keine Internetverbindung.");
                return;
            }

            if (!deleteResponse.ok) {
                const errorText = await deleteResponse.text?.();
                console.log("Fehler beim Löschen:", errorText);
                throw new Error("Fehler beim Löschen der Gruppe.");
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
                }}
                renderItem={({ item }) => {
                    if (item.isCreateButton) {
                        return (
                            <TouchableOpacity
                                style={[styles.groupCard, styles.createGroupCard, {
                                    width: cardWidth,
                                    marginHorizontal: cardMargin / 2,
                                    marginVertical: cardMargin / 2,
                                }]}
                                onPress={toggleCreationModal}
                            >
                                <Icon name="plus" size={24} color="#5fc9c9" />
                            </TouchableOpacity>
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
                toggleModal={toggleCreationModal}
                userId={userId}
                onGroupCreated={handleGroupCreated}
            />

            <Modal
                isVisible={isDeleteModalVisible}
                onBackdropPress={() => setIsDeleteModalVisible(false)}
                useNativeDriver
            >
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
                            <Text style={[styles.modalButtonText, { color: "white" }]}>Löschen</Text>
                        </TouchableOpacity>
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
        backgroundColor: "#E0F7FA",
        borderColor: "#E0F7FA",
        borderWidth: 1, // sonst graue Ecken bei android!!
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
        backgroundColor: '#5FC9C9',
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
    }
});