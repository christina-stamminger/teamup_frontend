import React, {
  useState,
  useEffect,
  useCallback,
} from 'react';

import {
  View,
  Text,
  Alert,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  BackHandler,
} from 'react-native';

import Icon from 'react-native-vector-icons/FontAwesome';
import * as SecureStore from 'expo-secure-store';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';

import CollapsibleTodoCard from '../components/CollapsibleTodoCard';
import GroupCreationModal from '../components/GroupCreationModal';
import AddMemberCard from '../components/AddMemberCard';
import AddMemberModal from '../components/AddMemberModal';
import GroupListModal from '../components/GroupListModal';
import FilterBar from '../components/FilterBar';

import { useUser } from '../components/context/UserContext';
import { useNetwork } from '../components/context/NetworkContext';
import { useUnread } from '../components/context/UnreadContext';

import { getAvatarColor } from '../utils/getAvatarColor';
import { API_URL } from '../config/env';

import { setupNotifications } from '../notifications/notifications';
import { registerPushTokenSafely } from '../services/pushService';


export default function MyTodosScreen() {
  const navigation = useNavigation();

  const {
    userId,
    accessToken,
    accessToken: tokenFromCtx,
    loading: userContextLoading,
    triggerGroupReload,
  } = useUser();

  const {
    isConnected,
    safeFetch,
    shouldShowError,
  } = useNetwork();

  const { setHasAnyUnread } = useUnread();


  // =========================================================
  // STATE
  // =========================================================

  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(false);

  const [groups, setGroups] = useState([]);

  // null bedeutet jetzt:
  // KEIN Gruppenfilter -> alle eigenen Todos anzeigen.
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [selectedGroupName, setSelectedGroupName] =
    useState('Alle Todos');

  const [userRoleInGroup, setUserRoleInGroup] = useState(null);

  const [newMembers, setNewMembers] = useState([]);

  const [isGroupModalVisible, setIsGroupModalVisible] =
    useState(false);

  const [isCreationModalVisible, setIsCreationModalVisible] =
    useState(false);

  const [isAddMemberModalVisible, setIsAddMemberModalVisible] =
    useState(false);

  const [isMembersModalVisible, setIsMembersModalVisible] =
    useState(false);




  // Trash
  const [trashedTodos, setTrashedTodos] = useState([]);
  const [loadingTrash, setLoadingTrash] = useState(false);
  const [isTrashModalVisible, setIsTrashModalVisible] =
    useState(false);


  // Statusfilter
  const FILTER_OPTIONS = [
    { label: 'Alle', value: 'ALL' },
    { label: 'Offen', value: 'OFFEN' },
    { label: 'In Arbeit', value: 'IN_ARBEIT' },
    { label: 'Erledigt', value: 'ERLEDIGT' },
    { label: 'Abgelaufen', value: 'ABGELAUFEN' },
  ];

  const [selectedFilters, setSelectedFilters] =
    useState(['ALL']);


  // =========================================================
  // HELPERS
  // =========================================================

  const getAuthToken = useCallback(async () => {
    if (tokenFromCtx) {
      return tokenFromCtx;
    }

    const stored =
      await SecureStore.getItemAsync('accessToken');

    return stored || null;
  }, [tokenFromCtx]);





  // =========================================================
  // FETCH MY TODOS
  // =========================================================

  /*
   * Lädt ALLE Todos, an denen der eingeloggte User beteiligt ist:
   *
   * - vom User erstellt
   * - vom User übernommen
   * - Gruppentodos
   * - gruppenlose PUBLIC-Todos
   *
   * Die Gruppe ist KEINE Voraussetzung mehr für diesen Request.
   */
  const fetchMyTodos = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const auth = await getAuthToken();

      if (!auth) {
        console.warn('⚠️ No auth token available');
        return;
      }

      const response = await safeFetch(
        `${API_URL}/api/todo/mine`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${auth}`,
            'Content-Type': 'application/json',
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

      if (!response?.ok) {
        throw new Error(
          `Failed to fetch my todos: ${response?.status}`
        );
      }

      const data = await response.json();

      const normalized =
        Array.isArray(data)
          ? data
          : [];

      setTodos(normalized);


    } catch (error) {
      console.error(
        'Error fetching my todos:',
        error
      );

      if (shouldShowError()) {
        Alert.alert(
          'Fehler',
          'Todos konnten nicht geladen werden'
        );
      }
    } finally {
      setLoading(false);
    }
  }, [
    userId,
    getAuthToken,
    safeFetch,
    shouldShowError,
  ]);


  // =========================================================
  // GROUPS
  // =========================================================

  const fetchGroups = useCallback(async () => {
    if (!userId) return;

    try {
      const auth = await getAuthToken();

      if (!auth) {
        console.warn('⚠️ No auth token available');
        return;
      }

      const response = await safeFetch(
        `${API_URL}/api/groups/myGroups`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${auth}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response?.offline) {
        return;
      }

      if (!response?.ok) {
        throw new Error(
          `Failed to fetch groups: ${response?.status}`
        );
      }

      const data = await response.json();

      const normalizedGroups =
        Array.isArray(data)
          ? data
          : [];

      setGroups(normalizedGroups);

      /*
       * Falls die aktuell als Filter ausgewählte Gruppe
       * nicht mehr existiert, Filter zurücksetzen.
       */
      if (
        selectedGroupId
        && !normalizedGroups.some(
          group =>
            group.groupId === selectedGroupId
        )
      ) {
        setSelectedGroupId(null);
        setSelectedGroupName('Alle Todos');
        setUserRoleInGroup(null);
        setNewMembers([]);
      }

    } catch (error) {
      console.error(
        '❌ Error fetching groups:',
        error
      );

      if (shouldShowError()) {
        Alert.alert(
          'Fehler',
          'Gruppen konnten nicht geladen werden.'
        );
      }
    }
  }, [
    userId,
    selectedGroupId,
    getAuthToken,
    safeFetch,
    shouldShowError,
  ]);


  const fetchNewMembers = useCallback(
    async (groupId) => {
      if (!groupId) {
        setNewMembers([]);
        return;
      }

      try {
        const auth = await getAuthToken();

        if (!auth) {
          return;
        }

        const response = await safeFetch(
          `${API_URL}/api/groups/${groupId}/members`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${auth}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (response?.offline) {
          return;
        }

        if (!response?.ok) {
          throw new Error(
            `Failed to fetch group members: ${response?.status}`
          );
        }

        const data = await response.json();

        setNewMembers(
          Array.isArray(data)
            ? data
            : []
        );

      } catch (error) {
        console.error(
          'Error fetching group members:',
          error
        );

        if (shouldShowError()) {
          Alert.alert(
            'Fehler',
            'Gruppenmitglieder konnten nicht geladen werden.'
          );
        }
      }
    },
    [
      getAuthToken,
      safeFetch,
      shouldShowError,
    ]
  );


  // =========================================================
  // TRASH
  // =========================================================

  /*
   * WICHTIG:
   *
   * Neuer Backend-Endpoint:
   *
   * GET /api/todo/trash
   *
   * Keine userId mehr in der URL.
   * Backend ermittelt User aus Authentication.
   */
  const fetchTrashedTodos = useCallback(async () => {
    if (!userId) return;

    try {
      setLoadingTrash(true);

      const auth = await getAuthToken();

      if (!auth) {
        console.warn('⚠️ No auth token available');
        return;
      }

      const response = await safeFetch(
        `${API_URL}/api/todo/trash`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${auth}`,
            'Content-Type': 'application/json',
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

      if (!response?.ok) {
        const errorText =
          response
            ? await response.text()
            : '';

        console.warn(
          'Failed to load trashed todos:',
          response?.status,
          errorText
        );

        return;
      }

      const data = await response.json();

      setTrashedTodos(
        Array.isArray(data)
          ? data
          : []
      );

    } catch (error) {
      console.error(
        'Error loading trashed todos:',
        error
      );
    } finally {
      setLoadingTrash(false);
    }
  }, [
    userId,
    getAuthToken,
    safeFetch,
  ]);


  const handleRestore = async (todoId) => {
    try {
      const auth = await getAuthToken();

      if (!auth) return;

      const response = await safeFetch(
        `${API_URL}/api/todo/${todoId}/restore`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${auth}`,
            'Content-Type': 'application/json',
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

      if (!response?.ok) {
        Alert.alert(
          'Fehler',
          'Todo konnte nicht wiederhergestellt werden.'
        );

        return;
      }

      Toast.show({
        type: 'success',
        text1: 'Todo wiederhergestellt',
      });

      await fetchTrashedTodos();
      await fetchMyTodos();

    } catch (error) {
      console.error(
        'Error restoring todo:',
        error
      );

      Alert.alert(
        'Fehler',
        'Ein Fehler ist aufgetreten'
      );
    }
  };


  const handlePermanentDelete = (todoId) => {
    Alert.alert(
      'Todo endgültig löschen',
      'Dieses Todo wird unwiderruflich gelöscht. Möchtest du fortfahren?',
      [
        {
          text: 'Abbrechen',
          style: 'cancel',
        },
        {
          text: 'Löschen',
          style: 'destructive',

          onPress: async () => {
            const previous =
              trashedTodos;

            /*
             * Optimistisches UI.
             */
            setTrashedTodos(
              current =>
                current.filter(
                  todo =>
                    todo.todoId !== todoId
                )
            );

            try {
              const auth =
                await getAuthToken();

              if (!auth) {
                throw new Error(
                  'missing_auth_token'
                );
              }

              const response =
                await safeFetch(
                  `${API_URL}/api/todo/${todoId}`,
                  {
                    method: 'DELETE',
                    headers: {
                      Authorization:
                        `Bearer ${auth}`,
                    },
                  }
                );

              if (response?.offline) {
                throw new Error(
                  'offline'
                );
              }

              if (
                !response
                || typeof response.ok !==
                'boolean'
              ) {
                throw new Error(
                  'invalid_response'
                );
              }

              if (!response.ok) {
                throw new Error(
                  `delete_failed_${response.status}`
                );
              }

              Toast.show({
                type: 'success',
                text1:
                  'Todo endgültig gelöscht',
              });

              await fetchMyTodos();

            } catch (error) {
              console.error(
                'Permanent delete failed:',
                error
              );

              /*
               * Rollback Optimistic UI.
               */
              setTrashedTodos(previous);

              if (
                error?.message ===
                'offline'
              ) {
                Toast.show({
                  type: 'info',
                  text1: 'Offline',
                  text2:
                    'Keine Internetverbindung',
                });

                return;
              }

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


  // =========================================================
  // EFFECTS
  // =========================================================

  /*
   * Push Setup.
   */
  useEffect(() => {
    if (!accessToken) return;

    const timeout = setTimeout(() => {
      setupNotifications();
      registerPushTokenSafely(
        accessToken
      );
    }, 1500);

    return () =>
      clearTimeout(timeout);

  }, [accessToken]);


  /*
   * Bottom-Nav Unread Indicator.
   */
  useEffect(() => {

    const hasUnread =
      todos.some(
        todo =>
          todo.hasUnreadMessages === true
      );

    setHasAnyUnread(
      hasUnread
    );

  }, [
    todos,
    setHasAnyUnread,
  ]);


  /*
   * Beim Logout Modals schließen.
   */
  useEffect(() => {
    if (accessToken) return;

    setIsGroupModalVisible(false);
    setIsTrashModalVisible(false);
    setIsMembersModalVisible(false);
    setIsAddMemberModalVisible(false);
    setIsCreationModalVisible(false);

  }, [accessToken]);


  /*
   * Trash laden, sobald Modal geöffnet wird.
   */
  useEffect(() => {
    if (!isTrashModalVisible) return;
    if (!userId) return;

    fetchTrashedTodos();

  }, [
    isTrashModalVisible,
    userId,
    fetchTrashedTodos,
  ]);


  /*
   * Bei wiederhergestellter Netzwerkverbindung
   * meine Todos erneut laden.
   */
  useEffect(() => {
    if (!isConnected || !userId) {
      return;
    }

    fetchMyTodos();

    if (selectedGroupId) {
      fetchNewMembers(
        selectedGroupId
      );
    }

  }, [
    isConnected,
    userId,
    selectedGroupId,
    fetchMyTodos,
    fetchNewMembers,
  ]);


  /*
   * Screen wird fokussiert:
   *
   * - IMMER /mine laden
   * - Gruppen laden
   * - Mitglieder nur, falls ein Gruppenfilter aktiv ist
   */
  useFocusEffect(
    useCallback(() => {
      if (!userId) {
        return;
      }

      fetchMyTodos();
      fetchGroups();

      if (selectedGroupId) {
        fetchNewMembers(
          selectedGroupId
        );
      }

    }, [
      userId,
      selectedGroupId,
      fetchMyTodos,
      fetchGroups,
      fetchNewMembers,
    ])
  );


  /*
   * Android Back Button.
   */
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (isTrashModalVisible) {
          setIsTrashModalVisible(
            false
          );

          return true;
        }

        if (isGroupModalVisible) {
          setIsGroupModalVisible(
            false
          );

          return true;
        }

        if (isMembersModalVisible) {
          setIsMembersModalVisible(
            false
          );

          return true;
        }

        if (navigation.canGoBack()) {
          return false;
        }

        BackHandler.exitApp();

        return true;
      };

      const subscription =
        BackHandler.addEventListener(
          'hardwareBackPress',
          onBackPress
        );

      return () =>
        subscription.remove();

    }, [
      navigation,
      isTrashModalVisible,
      isGroupModalVisible,
      isMembersModalVisible,
    ])
  );


  // =========================================================
  // FILTER
  // =========================================================

  /*
   * Backend liefert alle "meine Todos".
   *
   * Status + Gruppe sind ausschließlich UI-Filter.
   */
  const filteredTodos =
    todos.filter(todo => {
      const matchesGroup =
        !selectedGroupId
        || todo.groupId ===
        selectedGroupId;

      const status =
        (todo.status || '')
          .toUpperCase();

      const matchesStatus =
        selectedFilters.includes(
          'ALL'
        )
        || selectedFilters.includes(
          status
        );

      return (
        matchesGroup
        && matchesStatus
      );
    });


  const handleSelectFilter = (
    filterValue
  ) => {
    if (filterValue === 'ALL') {
      setSelectedFilters(['ALL']);
      return;
    }

    setSelectedFilters(previous => {
      const updated =
        previous.includes(filterValue)
          ? previous.filter(
            filter =>
              filter !==
              filterValue
          )
          : [
            ...previous.filter(
              filter =>
                filter !== 'ALL'
            ),
            filterValue,
          ];

      return updated.length === 0
        ? ['ALL']
        : updated;
    });
  };


  // =========================================================
  // GROUP FILTER
  // =========================================================

  const handleGroupSelect = (groupId) => {

    // "Alle Todos"
    if (groupId == null) {
      setSelectedGroupId(null);
      setSelectedGroupName('Alle Todos');
      setUserRoleInGroup(null);
      setNewMembers([]);
      setIsGroupModalVisible(false);

      return;
    }

    const selectedGroup =
      groups.find(
        group =>
          group.groupId === groupId
      );

    if (!selectedGroup) {
      return;
    }

    setSelectedGroupId(
      selectedGroup.groupId
    );

    setSelectedGroupName(
      selectedGroup.groupName
    );

    setUserRoleInGroup(
      selectedGroup.role
    );

    setIsGroupModalVisible(false);

    fetchNewMembers(
      selectedGroup.groupId
    );
  };

  // =========================================================
  // GROUP MANAGEMENT
  // =========================================================

  const handleGroupCreated = async (
    newGroup
  ) => {
    setIsCreationModalVisible(false);

    /*
     * Neu angelegte Gruppe als Filter auswählen.
     */
    setSelectedGroupId(
      newGroup.groupId
    );

    setSelectedGroupName(
      newGroup.groupName
    );

    setUserRoleInGroup(
      newGroup.role
    );

    await fetchGroups();

    triggerGroupReload();
  };


  const handleRemoveUser = async (
    userIdToRemove
  ) => {
    if (!selectedGroupId) {
      return;
    }

    try {
      const auth =
        await getAuthToken();

      if (!auth) return;

      const response =
        await safeFetch(
          `${API_URL}/api/groups/removeUser?userId=${userIdToRemove}&groupId=${selectedGroupId}`,
          {
            method: 'DELETE',
            headers: {
              Authorization:
                `Bearer ${auth}`,
              'Content-Type':
                'application/json',
            },
          }
        );

      if (response?.offline) {
        Toast.show({
          type: 'info',
          text1: 'Offline',
          text2:
            'Keine Internetverbindung',
        });

        return;
      }

      if (!response?.ok) {
        throw new Error(
          'User konnte nicht entfernt werden.'
        );
      }

      await fetchNewMembers(
        selectedGroupId
      );

      Alert.alert(
        'Erfolg',
        'User erfolgreich aus Gruppe entfernt.'
      );

    } catch (error) {
      console.error(
        'Error removing user:',
        error
      );

      Alert.alert(
        'Fehler',
        'User konnte nicht aus der Gruppe entfernt werden.'
      );
    }
  };


  // =========================================================
  // MODAL HELPERS
  // =========================================================

  const toggleTrashModal = () =>
    setIsTrashModalVisible(
      previous => !previous
    );

  const openGroupModal = () =>
    setIsGroupModalVisible(true);

  const closeGroupModal = () =>
    setIsGroupModalVisible(false);

  const toggleCreationModal = () =>
    setIsCreationModalVisible(
      previous => !previous
    );

  const handleAddMember = () =>
    setIsAddMemberModalVisible(
      true
    );


  // Add-Button nur für Admins
  const extendedMembers =
    userRoleInGroup === 'ADMIN'
      ? [
        ...newMembers,
        { type: 'addButton' },
      ]
      : [...newMembers];


  // =========================================================
  // GUARD CLAUSES
  //
  // WICHTIG:
  // Erst NACH allen Hooks.
  // =========================================================

  if (userContextLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator
          size="large"
          color="#4FB6B8"
        />

        <Text style={styles.loadingText}>
          Lade Benutzerdaten...
        </Text>
      </View>
    );
  }


  if (!userId) {
    return (
      <View style={styles.centered}>
        <Icon
          name="exclamation-circle"
          size={48}
          color="#FF6B6B"
        />

        <Text style={styles.userErrorTitle}>
          Keine Benutzer-ID verfügbar
        </Text>

        <Text style={styles.userErrorText}>
          Bitte melde dich erneut an
        </Text>
      </View>
    );
  }


  // =========================================================
  // RENDER
  // =========================================================

  return (
    <View style={styles.container}>

      {/* HEADER */}
      {/* HEADER */}
      <View style={styles.topArea}>
        <View style={styles.headerRow}>
          <View style={styles.headerSideSpacer} />

          <Text style={styles.headerTitle}>Meine Todos</Text>

          <TouchableOpacity
            onPress={toggleTrashModal}
            style={styles.trashButton}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Icon name="trash-o" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={openGroupModal}
          activeOpacity={0.8}
          style={styles.groupPill}
        >
          <Text style={styles.groupPillText}>{selectedGroupName}</Text>
          <Icon name="chevron-down" size={12} color="#6B7280" style={{ marginLeft: 6 }} />
        </TouchableOpacity>

        <FilterBar
          filters={FILTER_OPTIONS}
          selectedFilters={selectedFilters}
          onSelectFilter={handleSelectFilter}
        />
      </View>


      {/* TODO LIST */}
      <KeyboardAvoidingView
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : 'height'
        }
        keyboardVerticalOffset={
          Platform.OS === 'ios'
            ? 90
            : 0
        }
        style={{ flex: 1 }}
      >

        {loading ? (
          <ActivityIndicator
            style={{ marginTop: 16 }}
            color="#4FB6B8"
          />
        ) : (
          <FlatList
            data={filteredTodos}

            keyExtractor={item =>
              String(item.todoId)
            }

            ListEmptyComponent={
              <Text style={styles.emptyText}>
                Keine Todos vorhanden.
              </Text>
            }

            renderItem={({ item }) => (
              <CollapsibleTodoCard
                todo={item}

                hasUnread={
                  item.hasUnreadMessages === true
                }

                /*
                 * Statusänderung:
                 * immer /mine neu laden.
                 */
                onStatusUpdated={
                  fetchMyTodos
                }

                onDelete={deletedId => {
                  setTodos(previous =>
                    previous.filter(
                      todo =>
                        todo.todoId
                        !== deletedId
                    )
                  );

                  Toast.show({
                    type: 'info',
                    text1:
                      'Todo in den Papierkorb verschoben.',
                    visibilityTime: 1200,
                  });
                }}
              />
            )}
          />
        )}


        {/* GROUP LIST MODAL */}
        {accessToken && (
          <GroupListModal
            isVisible={
              isGroupModalVisible
            }
            onClose={
              closeGroupModal
            }
            groups={groups}
            selectedGroupId={
              selectedGroupId
            }
            onSelect={
              handleGroupSelect
            }
          />
        )}


        {/* TRASH MODAL */}
        {accessToken && (
          <Modal
            visible={
              isTrashModalVisible
            }
            transparent
            animationType="slide"
            onRequestClose={
              toggleTrashModal
            }
          >
            <TouchableWithoutFeedback
              onPress={
                toggleTrashModal
              }
            >
              <View
                style={
                  styles.trashOverlay
                }
              />
            </TouchableWithoutFeedback>


            <View
              style={
                styles.trashBottomContainer
              }
            >
              <View
                style={
                  styles.trashModalContainer
                }
              >

                <Text
                  style={
                    styles.trashModalTitle
                  }
                >
                  🗑️ Gelöschte To-Dos
                </Text>


                {loadingTrash ? (
                  <ActivityIndicator
                    color="#4FB6B8"
                  />

                ) : trashedTodos.length === 0 ? (

                  <Text
                    style={
                      styles.trashEmpty
                    }
                  >
                    Keine gelöschten To-Dos
                  </Text>

                ) : (

                  <ScrollView
                    style={{
                      maxHeight: 400,
                    }}
                  >
                    {trashedTodos.map(
                      todo => (
                        <View
                          key={
                            todo.todoId
                          }
                          style={
                            styles.trashItem
                          }
                        >

                          <View
                            style={{
                              flex: 1,
                            }}
                          >
                            <Text
                              style={
                                styles.trashText
                              }
                            >
                              {todo.title}
                            </Text>

                            <Text
                              style={
                                styles.trashDate
                              }
                            >
                              gelöscht am{' '}
                              {new Date(
                                todo.deletedAt
                              ).toLocaleDateString(
                                'de-DE'
                              )}
                            </Text>
                          </View>


                          <View
                            style={
                              styles.trashActions
                            }
                          >

                            <TouchableOpacity
                              style={
                                styles.restoreButton
                              }
                              onPress={() =>
                                handleRestore(
                                  todo.todoId
                                )
                              }
                            >
                              <Text
                                style={
                                  styles.restoreButtonText
                                }
                              >
                                Wiederherstellen
                              </Text>
                            </TouchableOpacity>


                            <TouchableOpacity
                              style={
                                styles.deleteForeverButton
                              }
                              onPress={() =>
                                handlePermanentDelete(
                                  todo.todoId
                                )
                              }
                            >
                              <Icon
                                name="trash"
                                size={16}
                                color="#fff"
                              />
                            </TouchableOpacity>

                          </View>

                        </View>
                      )
                    )}
                  </ScrollView>
                )}


                <TouchableOpacity
                  style={
                    styles.closeModalButton
                  }
                  onPress={
                    toggleTrashModal
                  }
                >
                  <Text
                    style={
                      styles.closeModalButtonText
                    }
                  >
                    Schließen
                  </Text>
                </TouchableOpacity>

              </View>
            </View>
          </Modal>
        )}


        {/* MEMBERS MODAL */}
        {accessToken && (
          <Modal
            visible={
              isMembersModalVisible
            }
            transparent
            animationType="slide"
            onRequestClose={() =>
              setIsMembersModalVisible(
                false
              )
            }
          >

            <TouchableWithoutFeedback
              onPress={() =>
                setIsMembersModalVisible(
                  false
                )
              }
            >
              <View
                style={
                  styles.trashOverlay
                }
              />
            </TouchableWithoutFeedback>


            <View
              style={
                styles.trashBottomContainer
              }
            >
              <View
                style={
                  styles.membersModal
                }
              >

                <Text
                  style={
                    styles.membersTitle
                  }
                >
                  Group Members
                </Text>


                <FlatList
                  data={
                    extendedMembers
                  }

                  keyExtractor={(
                    item,
                    index
                  ) =>
                    item.userId
                      ? String(
                        item.userId
                      )
                      : `addButton-${index}`
                  }

                  ItemSeparatorComponent={() => (
                    <View
                      style={
                        styles.separator
                      }
                    />
                  )}

                  keyboardShouldPersistTaps="handled"

                  renderItem={({
                    item,
                  }) => {

                    if (
                      item.type
                      === 'addButton'
                    ) {
                      return (
                        <AddMemberCard
                          onPress={
                            handleAddMember
                          }
                        />
                      );
                    }

                    const isAdmin =
                      item.role
                      === 'ADMIN';

                    return (
                      <View
                        style={
                          styles.memberRow
                        }
                      >

                        <View
                          style={
                            styles.memberInfo
                          }
                        >

                          <View
                            style={[
                              styles.avatarSmall,
                              {
                                backgroundColor:
                                  getAvatarColor(
                                    item.username
                                      ?.charAt(0)
                                    || '?'
                                  ),
                              },
                            ]}
                          >
                            <Text
                              style={
                                styles.avatarInitialMember
                              }
                            >
                              {(
                                item.username
                                  ?.charAt(0)
                                || '?'
                              ).toUpperCase()}
                            </Text>
                          </View>


                          <Text
                            style={[
                              styles.memberName,
                              isAdmin
                              && styles.adminName,
                            ]}
                          >
                            {item.username}
                          </Text>


                          {isAdmin && (
                            <Icon
                              name="shield"
                              size={12}
                              color="#FFD700"
                              style={{
                                marginLeft: 4,
                              }}
                            />
                          )}

                        </View>


                        {userRoleInGroup
                          === 'ADMIN' && (
                            <TouchableOpacity
                              onPress={() =>
                                handleRemoveUser(
                                  item.userId
                                )
                              }
                            >
                              <Icon
                                name="trash"
                                size={18}
                                color="#FF5C5C"
                              />
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


        {/* ADD MEMBER MODAL */}
        {accessToken && (
          <AddMemberModal
            isVisible={
              isAddMemberModalVisible
            }

            onClose={() =>
              setIsAddMemberModalVisible(
                false
              )
            }

            groupId={
              selectedGroupId
            }

            onMemberAdded={() => {
              if (selectedGroupId) {
                fetchNewMembers(
                  selectedGroupId
                );
              }

              triggerGroupReload();
            }}
          />
        )}


        {/* GROUP CREATION MODAL */}
        {accessToken && (
          <GroupCreationModal
            isVisible={
              isCreationModalVisible
            }

            onClose={
              toggleCreationModal
            }

            onGroupCreated={
              handleGroupCreated
            }
          />
        )}

      </KeyboardAvoidingView>

    </View>
  );
}


// =========================================================
// STYLES
// =========================================================

const styles = StyleSheet.create({

  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F7F7F7',
  },

  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  loadingText: {
    marginTop: 10,
    color: '#666',
  },

  userErrorTitle: {
    color: '#FF6B6B',
    fontSize: 16,
    marginTop: 16,
    fontWeight: '600',
  },

  userErrorText: {
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },

  // HEADER ROW
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },

  headerSideSpacer: {
    width: 36, // gleiche Breite wie trashButton, balanciert die Zeile
  },

  // HEADER

  topArea: {
    paddingTop: 14,
    paddingBottom: 4,
  },

  headerContainer: {
    marginBottom: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
  },

  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 28,
    fontWeight: "800",
    color: "#12151A",
    letterSpacing: -0.5,
  },

  // GROUP PILL
  groupPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F1F2F4",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    marginBottom: 14,
  },

  groupPillText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#12151A",
  },

  // GROUP FILTER

  groupFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  groupSelectorUnderline: {
    alignSelf: 'flex-start',
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

  // TRASH BUTTON

  trashRow: {
    alignItems: 'flex-start',
    marginLeft: 10,
  },

  trashButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },


  // GENERAL EMPTY

  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 30,
    fontSize: 14,
  },


  // TRASH MODAL

  trashOverlay: {
    flex: 1,
    backgroundColor:
      'rgba(0,0,0,0.4)',
  },

  trashBottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },

  trashModalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 30,
    maxHeight: '80%',
    minHeight: 250,
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
    justifyContent:
      'space-between',
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

  trashActions: {
    flexDirection: 'row',
    gap: 8,
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

  deleteForeverButton: {
    backgroundColor: '#FF5C5C',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
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


  // MEMBERS

  membersModal: {
    backgroundColor: 'white',
    padding: 20,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '60%',
  },

  membersTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },

  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
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
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },

  avatarInitialMember: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
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

});