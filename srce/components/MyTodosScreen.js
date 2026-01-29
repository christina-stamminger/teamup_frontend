import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Alert, FlatList, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform, Modal, BackHandler } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import * as SecureStore from 'expo-secure-store';
import CollapsibleTodoCard from '../components/CollapsibleTodoCard';
import { useUser } from "../components/context/UserContext";
import GroupCreationModal from "../components/GroupCreationModal";
import AddMemberCard from '../components/AddMemberCard';
import AddMemberModal from '../components/AddMemberModal';
import { useIsFocused, useFocusEffect } from '@react-navigation/native';
import GroupListModal from '../components/GroupListModal'
import { getAvatarColor } from '../utils/getAvatarColor';
import Toast from 'react-native-toast-message';
import FilterBar from '../components/FilterBar';
import { useNetwork } from "../components/context/NetworkContext";
import { useNavigation } from '@react-navigation/native';

import { useUnread } from '../components/context/UnreadContext';
import { API_URL } from "../../config/env";

export default function MyTodosScreen() {
  const navigation = useNavigation();
  const {
    logout,
    userId,
    accessToken,
    accessToken: tokenFromCtx,
    refreshToken,
    loading: userContextLoading,
    triggerGroupReload
  } = useUser();

  const { isConnected, safeFetch, shouldShowError } = useNetwork();

  // ✅ DEBUG: Log userId beim Mount
  useEffect(() => {
    console.log('👤 MyTodosScreen - UserContext:', {
      userId,
      hasToken: !!tokenFromCtx,
      userContextLoading
    });
  }, [userId, tokenFromCtx, userContextLoading]);

  // back button handler
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        // 1️⃣ Modals schließen
        if (isTrashModalVisible) {
          setIsTrashModalVisible(false);
          return true;
        }

        if (isGroupModalVisible) {
          setIsGroupModalVisible(false);
          return true;
        }

        if (isMembersModalVisible) {
          setIsMembersModalVisible(false);
          return true;
        }

        // 2️⃣ Kann navigiert werden? → React Navigation machen lassen
        if (navigation.canGoBack()) {
          return false;
        }

        // 3️⃣ Root-Screen → App verlassen (NICHT Logout!)
        BackHandler.exitApp();
        return true;
      };

      const sub = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress
      );

      return () => sub.remove();
    }, [
      navigation,
      isTrashModalVisible,
      isGroupModalVisible,
      isMembersModalVisible,
    ])
  );

  const [todos, setTodos] = useState([]);
  const [newMembers, setNewMembers] = useState([]);
  const [loading, setLoading] = useState(false); // ✅ Initial false!
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [selectedGroupName, setSelectedGroupName] = useState('Gruppe wählen');
  const [groups, setGroups] = useState([]);
  const [userRoleInGroup, setUserRoleInGroup] = useState(null);
  const [isGroupModalVisible, setIsGroupModalVisible] = useState(false);
  const [isCreationModalVisible, setIsCreationModalVisible] = useState(false);
  const [isAddMemberModalVisible, setIsAddMemberModalVisible] = useState(false);


  // Inapp Indicator in todoCard
  const [unreadMap, setUnreadMap] = useState({});

  // roter Punkt in bottom nav bei meine todos
  const { setHasAnyUnread } = useUnread();

  useEffect(() => {
    setHasAnyUnread(Object.values(unreadMap).some(Boolean));
  }, [unreadMap]);

  // Trash
  const [trashedTodos, setTrashedTodos] = useState([]);
  const [loadingTrash, setLoadingTrash] = useState(false);
  const [isTrashModalVisible, setIsTrashModalVisible] = useState(false);

  const toggleTrashModal = () => setIsTrashModalVisible(prev => !prev);
  const toggleGroupModal = () => setIsGroupModalVisible(prev => !prev);
  const toggleCreationModal = () => setIsCreationModalVisible(prev => !prev);

  // Members-Modal
  const [isMembersModalVisible, setIsMembersModalVisible] = useState(false);
  const toggleMembersModal = () => setIsMembersModalVisible(prev => !prev);

  // Add-Button nur für Admins
  const extendedMembers = userRoleInGroup === 'ADMIN'
    ? [...newMembers, { type: 'addButton' }]
    : [...newMembers];

  // Modal beim Logout schließen
  useEffect(() => {
    if (!accessToken) {
      setIsGroupModalVisible(false);
      setIsTrashModalVisible(false);
      setIsMembersModalVisible(false);
      setIsAddMemberModalVisible(false);
      setIsCreationModalVisible(false);
    }
  }, [accessToken]);


  // Inapp Indicator
  const computeUnreadMap = async (todos) => {
    const map = {};

    for (const todo of todos) {
      // Voraussetzung: Backend liefert lastMessageAt
      if (!todo.lastMessageAt) {
        map[todo.todoId] = false;
        continue;
      }

      const lastSeen = await SecureStore.getItemAsync(
        `chat_last_seen_${todo.todoId}`
      );

      if (!lastSeen) {
        map[todo.todoId] = true;
        continue;
      }

      map[todo.todoId] =
        new Date(todo.lastMessageAt).getTime() > Number(lastSeen);
    }

    setUnreadMap(map);
  };


  // FilterBar-Optionen
  const FILTER_OPTIONS = [
    { label: 'Alle', value: 'ALL' },
    { label: 'Offen', value: 'OFFEN' },
    { label: 'In Arbeit', value: 'IN_ARBEIT' },
    { label: 'Erledigt', value: 'ERLEDIGT' },
    { label: 'Abgelaufen', value: 'ABGELAUFEN' },
  ];

  const [selectedFilters, setSelectedFilters] = useState(['ALL']);

  // GroupListData
  const groupListData = [...groups, { isCreateButton: true }];

  // ✅ FIXED: Helper mit korrektem Key
  const getAuthToken = useCallback(async () => {
    if (tokenFromCtx) {
      console.log('🔑 Using token from context');
      return tokenFromCtx;
    }
    const stored = await SecureStore.getItemAsync('accessToken'); // ✅ Korrekter Key!
    console.log('🔑 Using token from SecureStore:', stored ? 'found' : 'not found');
    return stored || null;
  }, [tokenFromCtx]);

  // fetch
  const fetchTodos = useCallback(async (groupId) => {
    if (!groupId || !userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const auth = await getAuthToken();
      const response = await safeFetch(`${API_URL}/api/todo/group/${groupId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${auth}`,
          'Content-Type': 'application/json',
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

      if (!response?.ok) throw new Error('Failed to fetch todos');

      const data = await response.json();
      const normalized = Array.isArray(data) ? data : [];
      const filtered = normalized.filter((todo) => {
        const status = (todo.status || '').toUpperCase();
        const isMine = todo.userOfferedId === userId || todo.userTakenId === userId;
        const notDeleted = !todo.deletedAt;
        const isOffen = status === 'OFFEN';
        const offenVisible = !isOffen || todo.userOfferedId === userId;
        return isMine && notDeleted && offenVisible;
      });

      setTodos(filtered);
      computeUnreadMap(filtered); // Inapp Indicator

    } catch (error) {
      console.error('Error fetching todos:', error);
      if (shouldShowError()) Alert.alert('Fehler', 'Todos konnten nicht geladen werden');
    } finally {
      setLoading(false);
    }
  }, [userId]); // ✅ Nur userId!


  const fetchNewMembers = async (groupId) => {
    try {
      const auth = await getAuthToken();
      const response = await safeFetch(`${API_URL}/api/groups/${groupId}/members`, {
        headers: {
          'Authorization': `Bearer ${auth}`,
          'Content-Type': 'application/json',
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

      if (!response?.ok) throw new Error('Failed to fetch new members');
      const data = await response.json();
      setNewMembers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching new members:', error);
      if (shouldShowError()) Alert.alert('Error', 'Failed to fetch new members.');
    }
  };



  // ✅ GUARD CLAUSE: Warte auf userId
  if (userContextLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#4FB6B8" />
        <Text style={{ marginTop: 10, color: '#666' }}>Lade Benutzerdaten...</Text>
      </View>
    );
  }

  if (!userId) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Icon name="exclamation-circle" size={48} color="#FF6B6B" />
        <Text style={{ color: '#FF6B6B', fontSize: 16, marginTop: 16, fontWeight: '600' }}>
          Keine Benutzer-ID verfügbar
        </Text>
        <Text style={{ color: '#666', marginTop: 8, textAlign: 'center', paddingHorizontal: 40 }}>
          Bitte melde dich erneut an
        </Text>
      </View>
    );
  }

  // Trash laden...
  useEffect(() => {
    if (!isTrashModalVisible) return;
    if (!userId) return;
    fetchTrashedTodos();
  }, [isTrashModalVisible, userId]);

  // ✅ FIXED: useFocusEffect ohne fetchTodos in Dependencies
  useFocusEffect(
    useCallback(() => {
      console.log('📋 MyTodos Screen focused, userId:', userId);

      if (!userId) {
        console.warn('⚠️ No userId available');
        return;
      }

      // Gruppen laden
      const loadGroups = async () => {
        try {
          console.log('📡 Fetching groups...');
          const auth = await getAuthToken();

          if (!auth) {
            console.error('❌ No auth token available');
            return;
          }

          const response = await safeFetch(`${API_URL}/api/groups/myGroups`, {
            headers: {
              'Authorization': `Bearer ${auth}`,
              'Content-Type': 'application/json',
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

          if (!response?.ok) {
            console.error('❌ Groups fetch failed:', response?.status);
            throw new Error('Failed to fetch groups');
          }

          const data = await response.json();
          console.log('✅ Loaded groups:', data.length);
          setGroups(Array.isArray(data) ? data : []);
        } catch (error) {
          console.error('❌ Error fetching groups:', error);
          if (shouldShowError()) {
            Alert.alert('Error', 'Failed to fetch groups.');
          }
        }
      };

      loadGroups();



      // Members & Todos wenn Gruppe ausgewählt
      if (selectedGroupId) {
        console.log('📡 Loading members & todos for group:', selectedGroupId);
        fetchNewMembers(selectedGroupId);
        fetchTodos(selectedGroupId);
      }

      // Inapp Indicator
      // 🔴 Unread-Indicator neu berechnen beim Zurückkommen
      if (todos.length > 0) {
        computeUnreadMap(todos);
      }

    }, [userId, selectedGroupId]) // ✅ Keine Funktionen!
  );


  // Letzte Gruppe default mäßig laden und anzeigen
  useEffect(() => {
    // ❌ Wenn bereits eine Gruppe gewählt ist → nichts tun
    if (selectedGroupId) return;

    // ❌ Wenn noch keine Gruppen geladen sind → warten
    if (!groups || groups.length === 0) return;

    const restoreLastSelectedGroup = async () => {
      try {
        const stored = await SecureStore.getItemAsync("last_selected_group");
        if (!stored) return;

        const parsed = JSON.parse(stored);

        if (!parsed?.groupId) return;

        // 🔍 prüfen, ob User noch Mitglied dieser Gruppe ist
        const match = groups.find(
          (g) => g.groupId === parsed.groupId
        );

        if (!match) return;

        // ✅ Gruppe automatisch setzen
        setSelectedGroupId(match.groupId);
        setSelectedGroupName(match.groupName);
        setUserRoleInGroup(match.role);

        // ✅ Daten sofort laden
        fetchTodos(match.groupId);
        fetchNewMembers(match.groupId);
      } catch (err) {
        console.warn("Failed to restore last selected group", err);
      }
    };

    restoreLastSelectedGroup();
  }, [groups, selectedGroupId]);


  useEffect(() => {
    if (
      groups.length === 1 &&
      !selectedGroupId
    ) {
      const onlyGroup = groups[0];

      console.log("✅ Auto-select single group:", onlyGroup.groupName);

      setSelectedGroupId(onlyGroup.groupId);
      setSelectedGroupName(onlyGroup.groupName);
      setUserRoleInGroup(onlyGroup.role);

      // gleich Daten laden
      fetchTodos(onlyGroup.groupId);
      fetchNewMembers(onlyGroup.groupId);
    }
  }, [groups]);

  // Wenn Verbindung wiederkommt
  useEffect(() => {
    if (!isConnected || !userId) return;

    if (selectedGroupId) {
      fetchTodos(selectedGroupId);
      fetchNewMembers(selectedGroupId);
    }
  }, [isConnected, userId, selectedGroupId]);

  const fetchGroups = async () => {
    try {
      console.log('📡 fetchGroups called');
      const auth = await getAuthToken();

      if (!auth) {
        console.error('❌ No token available');
        return;
      }

      const response = await safeFetch(`${API_URL}/api/groups/myGroups`, {
        headers: {
          'Authorization': `Bearer ${auth}`,
          'Content-Type': 'application/json',
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

      if (!response?.ok) {
        console.error('❌ fetchGroups failed:', response?.status);
        throw new Error('Failed to fetch groups');
      }

      const data = await response.json();
      console.log('✅ fetchGroups success:', data.length);
      setGroups(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('❌ Error fetching groups:', error);
      if (shouldShowError()) {
        Alert.alert('Error', 'Failed to fetch groups.');
      }
    }
  };

  const fetchTrashedTodos = async () => {
    try {
      setLoadingTrash(true);
      const auth = await getAuthToken();
      const response = await safeFetch(`${API_URL}/api/todo/trash/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${auth}`,
          'Content-Type': 'application/json',
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
      if (!response?.ok) {
        const errorText = response ? (await response.text?.()) : '';
        console.warn('Failed to load trashed todos:', response?.status, errorText);
        return;
      }

      const data = await response.json();
      setTrashedTodos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading trashed todos:', error);
    } finally {
      setLoadingTrash(false);
    }
  };

  const handleRestore = async (todoId) => {
    try {
      const auth = await getAuthToken();
      const response = await safeFetch(`${API_URL}/api/todo/${todoId}/restore`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${auth}`,
          'Content-Type': 'application/json',
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

      if (!response?.ok) {
        Alert.alert('Fehler', 'Konnte Todo nicht wiederherstellen');
        return;
      }

      Toast.show({ type: 'success', text1: 'Todo wiederhergestellt' });
      await fetchTrashedTodos();
      if (selectedGroupId) fetchTodos(selectedGroupId);
    } catch (error) {
      console.error('Error restoring todo:', error);
      Alert.alert('Fehler', 'Ein Fehler ist aufgetreten');
    }
  };

  // handle hardDelete!
  const handlePermanentDelete = (todoId) => {
    Alert.alert(
      'Todo endgültig löschen',
      'Dieses Todo wird unwiderruflich gelöscht. Möchtest du fortfahren?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: async () => {
            const previous = trashedTodos;

            // Optimistisches UI
            setTrashedTodos(prev => prev.filter(t => t.todoId !== todoId));

            try {
              const auth = await getAuthToken();

              const response = await safeFetch(
                `${API_URL}/api/todo/${todoId}`,
                {
                  method: 'DELETE',
                  headers: {
                    Authorization: `Bearer ${auth}`,
                  },
                }
              );

              if (response?.offline) {
                Toast.show({
                  type: 'info',
                  text1: 'Offline',
                  text2: 'Keine Internetverbindung',
                });
                return;
              }

              // ⛔ Kein echtes Response-Objekt
              if (!response || typeof response.ok !== 'boolean') {
                throw new Error('invalid_response');
              }

              // ⛔ HTTP-Fehler
              if (!response.ok) {
                throw new Error(`delete_failed_${response.status}`);
              }

              // ✅ SUCCESS (204 = OK)
              Toast.show({
                type: 'success',
                text1: 'Todo endgültig gelöscht',
              });

              // Optional: Todos neu laden
              if (selectedGroupId) {
                fetchTodos(selectedGroupId);
              }

            } catch (err) {
              console.error('Permanent delete failed:', err);

              // 🔁 Rollback UI
              setTrashedTodos(previous);

              Alert.alert(
                'Fehler',
                'Todo konnte nicht endgültig gelöscht werden.'
              );
            }
          },
        },
      ]
    );
  };


  // Filter-Logik (UI-Ebene)
  const filteredTodos = todos.filter((todo) => {
    if (selectedFilters.includes('ALL')) return true;
    const status = (todo.status || '').toUpperCase();
    return selectedFilters.includes(status);
  });





  const handleGroupCreated = async (newGroup) => {
    setIsCreationModalVisible(false);
    await fetchGroups();
    setSelectedGroupId(newGroup.groupId);
    setSelectedGroupName(newGroup.groupName);
    setUserRoleInGroup(newGroup.role);
    triggerGroupReload();   // Jetzt weiß CreateTodoScreen Bescheid

  };

  const handleGroupSelect = (groupId) => {
    const selectedGroup = groups.find((g) => g.groupId === groupId);
    if (!selectedGroup) return;
    setSelectedGroupId(groupId);
    setSelectedGroupName(selectedGroup.groupName);
    setUserRoleInGroup(selectedGroup.role);
    setIsGroupModalVisible(false);

    //letzte Gruppe merken
    SecureStore.setItemAsync(
      "last_selected_group",
      JSON.stringify({
        groupId: selectedGroup.groupId,
        groupName: selectedGroup.groupName,
        role: selectedGroup.role,
      })
    );


    fetchTodos(groupId);
    fetchNewMembers(groupId);
  };

  const handleAddMember = () => setIsAddMemberModalVisible(true);

  const handleDeleteTodo = async (todoId) => {
    try {
      const todo = todos.find((t) => t.todoId === todoId);
      const status = (todo?.status || '').toUpperCase();

      if (status === 'IN_ARBEIT') {
        Alert.alert(
          'Nicht erlaubt',
          'To-Dos im Status "In Arbeit" können nicht gelöscht werden.'
        );
        return;
      }

      const auth = await getAuthToken();
      const response = await safeFetch(`${API_URL}/api/todo/${todoId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${auth}` },
      });

      if (response?.offline) {
        Toast.show({
          type: 'info',
          text1: 'Offline',
          text2: 'Keine Internetverbindung',
        });
        return;
      }

      if (!response?.ok) {
        throw new Error('Fehler beim Laden der Todos.');
      }

      setTodos((prev) => prev.filter((t) => t.todoId !== todoId));

      Toast.show({
        type: 'success',
        text1: 'Todo gelöscht',
      });
    } catch (error) {
      console.error('Error deleting todo:', error);
      Alert.alert('Fehler', 'Todo konnte nicht gelöscht werden.');
    }
  };

  const handleSelectFilter = (filterValue) => {
    if (filterValue === 'ALL') {
      setSelectedFilters(['ALL']);
    } else {
      setSelectedFilters((prev) => {
        const updated = prev.includes(filterValue)
          ? prev.filter((f) => f !== filterValue)
          : [...prev.filter((f) => f !== 'ALL'), filterValue];
        return updated.length === 0 ? ['ALL'] : updated;
      });
    }
  };

  const handleRemoveUser = async (userIdToRemove) => {
    try {
      const auth = await getAuthToken();
      const response = await safeFetch(`${API_URL}/api/groups/removeUser?userId=${userIdToRemove}&groupId=${selectedGroupId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${auth}`,
          'Content-Type': 'application/json',
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

      if (!response?.ok) throw new Error('User konnte nicht entfernt werden.');

      fetchNewMembers(selectedGroupId);
      Alert.alert('Erfolg', 'User erfolgreich aus Gruppe entfernt.');
    } catch (error) {
      console.error('Error removing user:', error);
      Alert.alert('Error', 'User konnte nicht aus der Gruppe entfernt werden.');
    }
  };


  return (
    <View style={styles.container}>
      <View style={{ paddingVertical: 10 }}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Meine Todos</Text>
        </View>

        <TouchableOpacity onPress={toggleGroupModal} style={styles.groupSelectorUnderline}>
          <Text style={styles.groupSelectorUnderlineText}>
            {selectedGroupName || 'Gruppe wählen'}
          </Text>
          <View style={styles.underline} />
        </TouchableOpacity>

        <FilterBar
          filters={FILTER_OPTIONS}
          selectedFilters={selectedFilters}
          onSelectFilter={handleSelectFilter}
        />

        <View style={{ alignItems: 'flex-start', marginLeft: 10 }}>
          <TouchableOpacity
            onPress={toggleTrashModal}
            style={styles.trashButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="trash" size={24} color="#cccccc" />
          </TouchableOpacity>
        </View>
      </View>

      {selectedGroupId && userRoleInGroup === 'ADMIN' && <></>}


      {/* ✅ KeyboardAvoidingView um FlatList */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        style={{ flex: 1 }}
      >

        {loading ? (
          <ActivityIndicator style={{ marginTop: 16 }} />
        ) : (
          <FlatList
            data={filteredTodos}
            keyExtractor={(item, index) => (item?.todoId ? String(item.todoId) : String(index))}
            renderItem={({ item }) => (
              <View>
                <CollapsibleTodoCard
                  todo={item}
                  hasUnread={unreadMap[item.todoId]} // Inapp Indicator
                  onStatusUpdated={() => fetchTodos(selectedGroupId)}
                  onDelete={(deletedId) => {
                    setTodos((prev) => prev.filter((t) => t.todoId !== deletedId));
                    Toast.show({ type: 'info', text1: 'Todo in den Papierkorb verschoben.', visibilityTime: 1200 });
                  }}
                />

              </View>

            )}
          />
        )}

        {/* GroupListModal */}
        {accessToken && (
          <GroupListModal
            isVisible={isGroupModalVisible}
            onClose={toggleGroupModal}
            groups={groups}
            selectedGroupId={selectedGroupId}
            onSelect={handleGroupSelect}
          />
        )}

        {/* Trash Modal */}
        {accessToken && (
          <Modal
            visible={isTrashModalVisible}
            transparent
            animationType="slide"
            onRequestClose={toggleTrashModal} // Android Back Button
          >
            {/* Backdrop */}
            <TouchableWithoutFeedback onPress={toggleTrashModal}>
              <View style={styles.trashOverlay} />
            </TouchableWithoutFeedback>

            {/* Bottom Sheet */}
            <View style={styles.trashBottomContainer}>
              <View style={[styles.trashModalContainer, { minHeight: 250 }]}>
                <Text style={styles.trashModalTitle}>🗑️ Gelöschte To-Dos</Text>

                {loadingTrash ? (
                  <ActivityIndicator color="#4FB6B8" />
                ) : trashedTodos.length === 0 ? (
                  <Text style={styles.trashEmpty}>Keine gelöschten To-Dos</Text>
                ) : (
                  <ScrollView style={{ maxHeight: 400 }}>
                    {trashedTodos.map((todo) => (
                      <View key={todo.todoId} style={styles.trashItem}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.trashText}>{todo.title}</Text>
                          <Text style={styles.trashDate}>
                            gelöscht am{" "}
                            {new Date(todo.deletedAt).toLocaleDateString("de-DE")}
                          </Text>
                        </View>

                        {/* Buttons */}
                        <View style={{ flexDirection: "row", gap: 8 }}>
                          <TouchableOpacity
                            style={styles.restoreButton}
                            onPress={() => handleRestore(todo.todoId)}
                          >
                            <Text style={styles.restoreButtonText}>
                              Wiederherstellen
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.deleteForeverButton}
                            onPress={() => handlePermanentDelete(todo.todoId)}
                          >
                            <Icon name="trash" size={16} color="#fff" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </ScrollView>
                )}

                <TouchableOpacity
                  style={styles.closeModalButton}
                  onPress={toggleTrashModal}
                >
                  <Text style={styles.closeModalButtonText}>Schließen</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}

        {/* Members Modal */}
        {accessToken && (
          <Modal
            visible={isMembersModalVisible}
            transparent
            animationType="slide"
            onRequestClose={toggleMembersModal} // Android Back Button
          >
            {/* Backdrop */}
            <TouchableWithoutFeedback onPress={toggleMembersModal}>
              <View style={styles.trashOverlay} />
            </TouchableWithoutFeedback>

            {/* Bottom Sheet */}
            <View style={styles.trashBottomContainer}>
              <View
                style={{
                  backgroundColor: 'white',
                  padding: 20,
                  borderTopLeftRadius: 16,
                  borderTopRightRadius: 16,
                  maxHeight: '60%',
                }}
              >
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: 'bold',
                    marginBottom: 12,
                  }}
                >
                  Group Members
                </Text>

                <FlatList
                  data={extendedMembers}
                  keyExtractor={(item, index) =>
                    item.userId ? String(item.userId) : `addButton-${index}`
                  }
                  ItemSeparatorComponent={() => <View style={styles.separator} />}
                  keyboardShouldPersistTaps="handled"
                  renderItem={({ item }) => {
                    if (item.type === 'addButton') {
                      return <AddMemberCard onPress={handleAddMember} />;
                    }

                    const isAdmin = item.role === 'ADMIN';
                    return (
                      <View style={styles.memberRow}>
                        <View style={styles.memberInfo}>
                          <View
                            style={[
                              styles.avatarSmall,
                              {
                                backgroundColor: getAvatarColor(
                                  item.username?.charAt(0) || '?'
                                ),
                              },
                            ]}
                          >
                            <Text style={styles.avatarInitialMember}>
                              {(item.username?.charAt(0) || '?').toUpperCase()}
                            </Text>
                          </View>

                          <Text
                            style={[
                              styles.memberName,
                              isAdmin && styles.adminName,
                            ]}
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

                        {userRoleInGroup === 'ADMIN' && (
                          <TouchableOpacity
                            onPress={() => handleRemoveUser(item.userId)}
                          >
                            <Icon name="trash" size={18} color="#FF5C5C" />
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  }}
                />
              </View>
            </View>
          </Modal>
        )}



        {/* Optional: AddMemberModal mounten, wenn vorhanden */}
        {accessToken && typeof AddMemberModal === 'function' && (
          <AddMemberModal
            isVisible={isAddMemberModalVisible}
            onClose={() => setIsAddMemberModalVisible(false)}
            groupId={selectedGroupId}
            onMemberAdded={() => {
              fetchNewMembers(selectedGroupId);
              triggerGroupReload();   // globales Signal
            }}
          />
        )}

        {/* Optional: GroupCreationModal – nur anzeigen, wenn per toggleCreationModal genutzt */}
        {accessToken && typeof GroupCreationModal === 'function' && (
          <GroupCreationModal
            isVisible={isCreationModalVisible}
            onClose={toggleCreationModal}
            onGroupCreated={handleGroupCreated}
          />
        )}
      </KeyboardAvoidingView>
    </View>
  );



}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    marginTop: 0,
    backgroundColor: '#F7F7F7',
  },
  groupButton: {
    backgroundColor: '#4FB6B8',
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
    backgroundColor: '#E6F9F9',
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
    backgroundColor: '#FFF8DC',
    borderRadius: 6,
    paddingHorizontal: 8,
  },
  adminText: {
    fontWeight: 'bold',
    color: '#DAA520',
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
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
    marginLeft: 44,
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
    color: '#4FB6B8',
  },
  headerContainer: {
    marginBottom: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 26,
    color: '#333',
    textAlign: 'center',
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
  groupSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  groupSelectorText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  trashModalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 30,
    maxHeight: '80%',
  },
  trashModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  trashEmpty: {
    fontSize: 14,
    color: '#aaa',
    fontStyle: 'italic',
    marginTop: 5,
    textAlign: 'center',
  },
  trashItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingVertical: 10,
  },
  trashText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  trashDate: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  restoreButton: {
    backgroundColor: '#4FB6B8',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginLeft: 10,
  },
  restoreButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  closeModalButton: {
    alignSelf: 'center',
    marginTop: 15,
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  closeModalButtonText: {
    color: '#4FB6B8',
    fontWeight: '600',
    fontSize: 16,
  },
  trashButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
    minHeight: 44,
  },
  groupSelectorUnderline: {
    alignSelf: 'flex-start',
    marginBottom: 12,
    paddingVertical: 4,
  },
  groupSelectorUnderlineText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  underline: {
    height: 2,
    backgroundColor: '#4FB6B8',
    marginTop: 4,
    borderRadius: 1,
  },
  deleteForeverButton: {
    backgroundColor: '#FF5C5C',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trashOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
  },

  trashBottomContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },

});
