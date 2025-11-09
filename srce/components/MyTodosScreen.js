import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Alert, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import * as SecureStore from 'expo-secure-store';
import CollapsibleTodoCard from '../components/CollapsibleTodoCard';
import { useUser } from "../components/context/UserContext";
import Modal from 'react-native-modal';
import GroupCreationModal from "../components/GroupCreationModal"; // (optional, wird unten nicht gemountet – belassen, falls an anderer Stelle genutzt)
import AddMemberCard from '../components/AddMemberCard';
import AddMemberModal from '../components/AddMemberModal'; // (optional – nur mounten, wenn vorhanden)
import { useIsFocused, useFocusEffect } from '@react-navigation/native';
import GroupListModal from '../components/GroupListModal'
import { getAvatarColor } from '../utils/getAvatarColor';
import Toast from 'react-native-toast-message';
import FilterBar from '../components/FilterBar';
import { useNetwork } from "../components/context/NetworkContext"; // ✅ safeFetch + shouldShowError

export default function MyTodosScreen() {
  const { userId, token: tokenFromCtx, loading: userContextLoading } = useUser();
  const { isConnected, safeFetch, shouldShowError } = useNetwork(); // ✅ nutzt Response-kompatibles Objekt + {offline}

  const [todos, setTodos] = useState([]);
  const [newMembers, setNewMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [selectedGroupName, setSelectedGroupName] = useState('Gruppe wählen');
  const [groups, setGroups] = useState([]);
  const [userRoleInGroup, setUserRoleInGroup] = useState(null);
  const [isGroupModalVisible, setIsGroupModalVisible] = useState(false);
  const [isCreationModalVisible, setIsCreationModalVisible] = useState(false);
  const [isAddMemberModalVisible, setIsAddMemberModalVisible] = useState(false);

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

  // Helper: Token bevorzugt aus Context, Fallback SecureStore
  const getAuthToken = useCallback(async () => {
    if (tokenFromCtx) return tokenFromCtx;
    const stored = await SecureStore.getItemAsync('authToken');
    return stored || null;
  }, [tokenFromCtx]);

  // Gruppen laden bei User-Änderung
  useEffect(() => {
    if (!userId || userContextLoading) return;
    fetchGroups();
  }, [userId, userContextLoading]);

  // Trash-Inhalte laden, wenn Modal geöffnet ist
  useEffect(() => {
    if (!isTrashModalVisible) return;
    if (userContextLoading || !userId) return;
    fetchTrashedTodos();
  }, [isTrashModalVisible, userId, userContextLoading]);

  // Bei Screen-Fokus Gruppen refetchen (leichtgewichtig) & Mitglieder-Refetch für gewählte Gruppe
  useFocusEffect(
    useCallback(() => {
      fetchGroups();
      if (selectedGroupId) fetchNewMembers(selectedGroupId);
    }, [selectedGroupId])
  );

  // Re-Load Todos bei Fokus
  const isFocused = useIsFocused();
  useEffect(() => {
    if (isFocused && selectedGroupId) fetchTodos(selectedGroupId);
  }, [isFocused, selectedGroupId, fetchTodos]);

  // Wenn Verbindung wiederkommt: aktualisiere Gruppe & Todos
  useEffect(() => {
    if (!isConnected) return;
    if (selectedGroupId) {
      fetchTodos(selectedGroupId);
      fetchNewMembers(selectedGroupId);
    } else {
      fetchGroups();
    }
  }, [isConnected]);

  const fetchGroups = async () => {
    try {
      const auth = await getAuthToken();
      const response = await safeFetch(`http://192.168.50.116:8082/api/groups/myGroups`, {
        headers: {
          'Authorization': `Bearer ${auth}`,
          'Content-Type': 'application/json',
        },
      });

      if (response?.offline) {
        // stilles Fail – keine Störung der UX
        return;
      }

      if (!response?.ok) throw new Error('Failed to fetch groups');
      const data = await response.json();
      setGroups(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching groups:', error);
      if (shouldShowError()) {
        Alert.alert('Error', 'Failed to fetch groups.');
      }
    }
  };

  const fetchTrashedTodos = async () => {
    try {
      setLoadingTrash(true);
      const auth = await getAuthToken();
      const response = await safeFetch(`http://192.168.50.116:8082/api/todo/trash/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${auth}`,
          'Content-Type': 'application/json',
        },
      });

      if (response?.offline) {
        // kein Alert hier – Hintergrundaktion
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
      const response = await safeFetch(`http://192.168.50.116:8082/api/todo/${todoId}/restore`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${auth}`,
          'Content-Type': 'application/json',
        },
      });

      if (response?.offline) {
        Alert.alert('Offline', 'Keine Internetverbindung');
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

  // Filter-Logik (UI-Ebene)
  const filteredTodos = todos.filter((todo) => {
    if (selectedFilters.includes('ALL')) return true;
    const status = (todo.status || '').toUpperCase();
    return selectedFilters.includes(status);
  });

  const fetchTodos = useCallback(async (groupId) => {
    if (!groupId) return;
    if (userContextLoading) return;

    try {
      setLoading(true);
      const auth = await getAuthToken();
      const response = await safeFetch(`http://192.168.50.116:8082/api/todo/group/${groupId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${auth}`,
          'Content-Type': 'application/json',
        },
      });

      if (response?.offline) {
        // Nutzerfreundlicher Hinweis, weil dies eine sichtbare Aktion ist
        Toast.show({ type: 'info', text1: 'Offline', text2: 'Keine Internetverbindung' });
        return;
      }

      if (!response?.ok) throw new Error('Failed to fetch todos');

      const data = await response.json();

      // Normalisieren & filtern
      const normalized = Array.isArray(data) ? data : [];
      const filtered = normalized.filter((todo) => {
        const status = (todo.status || '').toUpperCase();
        const isMine = todo.userOfferedId === userId || todo.userTakenId === userId;
        const notDeleted = !todo.deletedAt;
        const isOffen = status === 'OFFEN';
        // Nur "OFFEN" sehen, wenn vom Nutzer angeboten
        const offenVisible = !isOffen || todo.userOfferedId === userId;
        return isMine && notDeleted && offenVisible;
      });

      setTodos(filtered);
      Toast.show({ type: 'info', text1: 'Todos aktualisiert', visibilityTime: 1000 });
    } catch (error) {
      console.error('Error fetching todos:', error);
      if (shouldShowError()) Alert.alert('Fehler', 'Todos konnten nicht geladen werden');
    } finally {
      setLoading(false);
    }
  }, [getAuthToken, userId, shouldShowError, safeFetch, userContextLoading]);

  // Auto-Refresh alle 60s bei Fokus
  useFocusEffect(
    useCallback(() => {
      if (!selectedGroupId) return undefined;
      fetchTodos(selectedGroupId);
      const interval = setInterval(() => {
        fetchTodos(selectedGroupId);
      }, 60000);
      return () => clearInterval(interval);
    }, [selectedGroupId, fetchTodos])
  );

  const fetchNewMembers = async (groupId) => {
    try {
      const auth = await getAuthToken();
      const response = await safeFetch(`http://192.168.50.116:8082/api/groups/${groupId}/members`, {
        headers: {
          'Authorization': `Bearer ${auth}`,
          'Content-Type': 'application/json',
        },
      });

      if (response?.offline) {
        Toast.show({ type: 'info', text1: 'Offline', text2: 'Mitglieder konnten nicht geladen werden' });
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

  const handleGroupCreated = (newGroup) => {
    setGroups((prev) => [...prev, newGroup]);
    setSelectedGroupId(newGroup.groupId);
    setSelectedGroupName(newGroup.groupName);
    setUserRoleInGroup(newGroup.role);
    setIsCreationModalVisible(false);
  };

  const handleGroupSelect = (groupId) => {
    const selectedGroup = groups.find((g) => g.groupId === groupId);
    if (!selectedGroup) return;
    setSelectedGroupId(groupId);
    setSelectedGroupName(selectedGroup.groupName);
    setUserRoleInGroup(selectedGroup.role);
    setIsGroupModalVisible(false);
    fetchTodos(groupId);
    fetchNewMembers(groupId);
  };

  const handleAddMember = () => setIsAddMemberModalVisible(true);

  const handleDeleteTodo = async (todoId) => {
    try {
      // ✅ Hole das betroffene Todo aus dem aktuellen State
      const todo = todos.find((t) => t.todoId === todoId);
      const status = (todo?.status || '').toUpperCase();

      // 🚫 Schutz: Todos mit Status "IN_ARBEIT" dürfen nicht gelöscht werden
      if (status === 'IN_ARBEIT') {
        Alert.alert(
          'Nicht erlaubt',
          'To-Dos im Status "In Arbeit" können nicht gelöscht werden.'
        );
        return; // ⛔️ Keine Löschung durchführen
      }

      // ✅ Normale Löschlogik
      const auth = await getAuthToken();
      const response = await safeFetch(`http://192.168.50.116:8082/api/todo/${todoId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${auth}` },
      });

      if (response?.offline) {
        Alert.alert('Offline', 'Keine Internetverbindung');
        return;
      }

      if (!response?.ok) {
        throw new Error('Failed to delete todo');
      }

      // Aus Liste entfernen
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
      const response = await safeFetch(`http://192.168.50.116:8082/api/groups/removeUser?userId=${userIdToRemove}&groupId=${selectedGroupId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${auth}`,
          'Content-Type': 'application/json',
        },
      });

      if (response?.offline) {
        Alert.alert('Offline', 'Keine Internetverbindung');
        return;
      }

      if (!response?.ok) throw new Error('Failed to remove user');

      fetchNewMembers(selectedGroupId);
      Alert.alert('Success', 'User removed from the group.');
    } catch (error) {
      console.error('Error removing user:', error);
      Alert.alert('Error', 'Could not remove user from the group.');
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
                onStatusUpdated={() => fetchTodos(selectedGroupId)}
                onDelete={(deletedId) => {
                  setTodos((prev) => prev.filter((t) => t.todoId !== deletedId));
                  Toast.show({ type: 'info', text1: 'Todo moved to trash', visibilityTime: 1200 });
                }}
              />
            </View>
          )}
        />
      )}

      {/* GroupListModal */}
      <GroupListModal
        isVisible={isGroupModalVisible}
        onClose={toggleGroupModal}
        groups={groups}
        selectedGroupId={selectedGroupId}
        onSelect={handleGroupSelect}
      />

      {/* Trash Modal */}
      <Modal
        isVisible={isTrashModalVisible}
        onBackdropPress={toggleTrashModal}
        backdropOpacity={0.4}
        animationIn="slideInUp"
        animationOut="slideOutDown"
        style={{ margin: 0, justifyContent: 'flex-end' }}
      >
        <View style={[styles.trashModalContainer, { minHeight: 250 }]}>
          <Text style={styles.trashModalTitle}>🗑️ Gelöschte To-Dos</Text>

          {loadingTrash ? (
            <ActivityIndicator color="#5FC9C9" />
          ) : trashedTodos.length === 0 ? (
            <Text style={styles.trashEmpty}>Keine gelöschten To-Dos</Text>
          ) : (
            <ScrollView style={{ maxHeight: 400 }}>
              {trashedTodos.map((todo) => (
                <View key={todo.todoId} style={styles.trashItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.trashText}>{todo.title}</Text>
                    <Text style={styles.trashDate}>
                      gelöscht am {new Date(todo.deletedAt).toLocaleDateString('de-DE')}
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.restoreButton} onPress={() => handleRestore(todo.todoId)}>
                    <Text style={styles.restoreButtonText}>Wiederherstellen</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}

          <TouchableOpacity style={styles.closeModalButton} onPress={toggleTrashModal}>
            <Text style={styles.closeModalButtonText}>Schließen</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Members Modal */}
      <Modal isVisible={isMembersModalVisible} onBackdropPress={toggleMembersModal} style={{ margin: 0, justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: 'white', padding: 20, borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '60%' }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>Group Members</Text>

          <FlatList
            data={extendedMembers}
            keyExtractor={(item, index) => (item.userId ? String(item.userId) : `addButton-${index}`)}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            renderItem={({ item }) => {
              if (item.type === 'addButton') return <AddMemberCard onPress={handleAddMember} />;

              const isAdmin = item.role === 'ADMIN';
              return (
                <View style={styles.memberRow}>
                  <View style={styles.memberInfo}>
                    <View style={[styles.avatarSmall, { backgroundColor: getAvatarColor(item.username?.charAt(0) || '?') }]}>
                      <Text style={styles.avatarInitialMember}>{(item.username?.charAt(0) || '?').toUpperCase()}</Text>
                    </View>
                    <Text style={[styles.memberName, isAdmin && styles.adminName]}>{item.username}</Text>
                    {isAdmin && <Icon name="shield" size={12} color="#FFD700" style={{ marginLeft: 4 }} />}
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

      {/* Optional: AddMemberModal mounten, wenn vorhanden */}
      {typeof AddMemberModal === 'function' && (
        <AddMemberModal
          isVisible={isAddMemberModalVisible}
          onClose={() => setIsAddMemberModalVisible(false)}
          groupId={selectedGroupId}
          onMemberAdded={() => fetchNewMembers(selectedGroupId)}
        />
      )}

      {/* Optional: GroupCreationModal – nur anzeigen, wenn per toggleCreationModal genutzt */}
      {typeof GroupCreationModal === 'function' && (
        <GroupCreationModal
          isVisible={isCreationModalVisible}
          onClose={toggleCreationModal}
          onGroupCreated={handleGroupCreated}
        />
      )}
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
    backgroundColor: '#5fc9c9',
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
    color: '#5FC9C9',
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
    backgroundColor: '#5FC9C9',
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
    color: '#5FC9C9',
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
    backgroundColor: '#5FC9C9',
    marginTop: 4,
    borderRadius: 1,
  },
});
