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

import { getAvatarColor } from '../utils/getAvatarColor';
import Modal from "react-native-modal";
import { Picker } from "@react-native-picker/picker"; // falls nicht installiert: npm install @react-native-picker/picker
import Toast from "react-native-toast-message";



export default function GroupDetails({ route, navigation }) {
  const { group } = route.params;
  const { user } = useUser();
  const { userId, username } = useUser(); // korrekt aus Context
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddMemberModalVisible, setIsAddMemberModalVisible] = useState(false);
  const [isTransferModalVisible, setIsTransferModalVisible] = useState(false);
  const [selectedNewAdmin, setSelectedNewAdmin] = useState(null);


  // Adminstatus dynamisch aus Mitgliedsliste ableiten
  const currentUserRelation = members.find((m) => String(m.userId) === String(userId));
  const isUserAdmin = currentUserRelation?.role === "ADMIN" || group?.role === "ADMIN";


  //const isUserAdmin = group?.role === 'ADMIN';

  const fetchNewMembers = async (groupId) => {
    try {
      const token = await SecureStore.getItemAsync('accessToken');
      const response = await fetch(
        `${API_URL}/api/groups/${groupId}/members`,
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
    console.log("🧩 Group received in GroupDetails:", group);

    if (group?.groupId) {
      fetchNewMembers(group.groupId);
    }
  }, [group]);

  const handleAddMember = () => {
    setIsAddMemberModalVisible(true);
  };

  const handleRemoveUser = async (userIdToRemove) => {
    try {
      const token = await SecureStore.getItemAsync('accessToken');
      const response = await fetch(
        `${API_URL}/api/groups/removeUser?userId=${userIdToRemove}&groupId=${group.groupId}`,
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

  // transfer admin modal handlers would go here
  const handleAdminLeavePress = () => {
    console.log("⚙️ handleAdminLeavePress triggered!");

    if (members.length <= 1) {
      Alert.alert(
        "Aktion nicht möglich",
        "Du bist das einzige Mitglied dieser Gruppe. Bitte lösche die Gruppe stattdessen."
      );
      return;
    }
    setIsTransferModalVisible(true);
  };
  console.log(userId);
  //console.log("userId:" + userId);


  const handleTransferAndLeave = async () => {
    if (!selectedNewAdmin) {
      Alert.alert("Fehler", "Bitte wähle ein Mitglied aus, das Admin werden soll.");
      return;
    }

    try {
      const token = await SecureStore.getItemAsync("accessToken");
      const response = await fetch(
        `${API_URL}/api/groups/transferAdminAndLeave?groupId=${group.groupId}&oldAdminId=${userId}&newAdminId=${selectedNewAdmin}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Fehler bei der Admin-Übertragung.");
      }

      Toast.show({
        type: "success",
        text1: "Adminrolle übertragen",
        text2: "Du hast die Gruppe verlassen.",
        visibilityTime: 2000,
      });

      setIsTransferModalVisible(false);
      navigation.goBack(); // Zurück zur Gruppenübersicht
    } catch (error) {
      console.error("Error transferring admin:", error);
      Alert.alert("Fehler", error.message);
    }
  };

  console.log("🧩 Group received:", group);
  console.log("👤 Logged-in userId:", userId);
  console.log("🛡️ currentUserRelation:", members.find((m) => String(m.userId) === String(userId)));
  console.log("✅ isUserAdmin computed:", currentUserRelation?.role === "ADMIN" || group?.role === "ADMIN");


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
            //const isNotSelf = item.userId !== user?.id;
            const isNotSelf = String(item.userId) !== String(userId);

            console.log("Rendering member row:", {
              username: item.username,
              itemUserId: item.userId,
              loggedInUserId: userId,
              isUserAdmin,
              isNotSelf: item.userId !== userId,
            });


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

                {/* 🔹 Admin kann andere Mitglieder löschen */}
                {isUserAdmin && isNotSelf && (
                  <TouchableOpacity
                    onPress={() => handleRemoveUser(item.userId)}
                    hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                    style={styles.trashButton}
                    activeOpacity={0.6}
                  >
                    <Icon name="trash" size={20} color="#FF5C5C" />
                  </TouchableOpacity>
                )}

                {/* 🔹 Admin möchte sich selbst löschen → öffnet Transfer-Modal */}
                {isUserAdmin && !isNotSelf && (
                  <TouchableOpacity
                    onPress={handleAdminLeavePress}
                    hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                    style={styles.trashButton}
                    activeOpacity={0.6}
                    android_ripple={{ color: '#FF5C5C20', borderless: true }}  // ← Android Ripple
                  >
                    <Icon name="trash" size={20} color="#FF5C5C" />
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

      {/* Transfer Admin Modal */}

      <Modal
        isVisible={isTransferModalVisible}
        onBackdropPress={() => setIsTransferModalVisible(false)}
        onBackButtonPress={() => setIsTransferModalVisible(false)} // ← WICHTIG für Android!
        backdropOpacity={0.5}
        animationIn="slideInUp"  // ← fadeInUp kann auf Android Probleme machen
        animationOut="slideOutDown"
        useNativeDriver={true}
        useNativeDriverForBackdrop={true}
        style={{ justifyContent: "center", margin: 0 }}
        avoidKeyboard={true}  // ← WICHTIG für Picker auf Android
        statusBarTranslucent={true}  // ← Für Android Status Bar
      >

        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Du bist Admin dieser Gruppe</Text>
          <Text style={styles.modalText}>
            Übertrage zuerst die Admin-Rolle an ein anderes Gruppenmitglied, um die Gruppe zu verlassen.
          </Text>

          <Picker
            selectedValue={selectedNewAdmin}
            onValueChange={(itemValue) => setSelectedNewAdmin(itemValue)}
            style={styles.picker}
          >
            <Picker.Item label="Wähle ein Mitglied..." value={null} />
            {members
              .filter((m) => m.userId !== user?.id)
              .map((member) => (
                <Picker.Item key={member.userId} label={member.username} value={member.userId} />
              ))}
          </Picker>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setIsTransferModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>Abbrechen</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.confirmButton]}
              onPress={handleTransferAndLeave}
            >
              <Text style={[styles.modalButtonText, { color: "white" }]}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>


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
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  modalText: {
    fontSize: 14,
    color: "#555",
    marginBottom: 15,
    textAlign: "center",
  },
  picker: {
    width: "100%",
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  modalButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: "#e0e0e0",
  },
  confirmButton: {
    backgroundColor: "#5FC9C9",
  },
  modalButtonText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "600",
  },
  trashButton: {
    padding: 12,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
