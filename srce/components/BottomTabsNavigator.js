import React, { useState, useEffect } from "react";
import { View, TouchableOpacity } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Toast from "react-native-toast-message";
import { Icons } from "../ui/icons";
import BringitsChip from "../components/BringitsChip";
import LogoutButton from "../components/LogoutButton";
import MyTodosScreen from "../components/MyTodosScreen";
import OpenTodosScreen from "../components/OpenTodosScreen";
import CreateTodoScreen from "../components/CreateTodoScreen";
import MyGroups from "../components/MyGroups";
import GroupCreationModal from "./GroupCreationModal";
import { useUser } from "../components/context/UserContext";
import { useUnread } from '../components/context/UnreadContext';

import { API_URL } from "../../config/env";

const Tab = createBottomTabNavigator();

export default function BottomTabsNavigator({ navigation }) {
  const {
    username,
    userId,
    bringits,
    accessToken,
    groupsVersion,
  } = useUser();

  const [isModalVisible, setModalVisible] = useState(false);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [hasGroups, setHasGroups] = useState(false);

  const { hasAnyUnread } = useUnread();

  useEffect(() => {
    if (!accessToken) {
      setModalVisible(false);
      setSelectedGroup("");
      setGroups([]);
      setHasGroups(false);
    }
  }, [accessToken]);

  // 🟢 Modal niemals rendern, wenn ausgeloggt
  if (!accessToken) {
    return null;
  }

  // 🟢 Modal nur UI – KEINE Datenlogik
  const toggleModal = () => {
    setModalVisible((prev) => !prev);
  };

  // 🟢 Gruppen laden – NUR wenn User eingeloggt
  const fetchUserGroups = async () => {
    if (!accessToken || !userId) return;

    try {
      const response = await fetch(
        `${API_URL}/api/groups/myGroups?userId=${userId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setGroups(data);
      setHasGroups(Array.isArray(data) && data.length > 0);
    } catch (error) {
      console.error("❌ Error fetching groups:", error);
      setHasGroups(false);
    }
  };

  // 🟢 Declarative Effect – logout-sicher
  useEffect(() => {
    if (!accessToken || !userId) return;
    fetchUserGroups();
  }, [accessToken, userId, groupsVersion]);

  const handleGroupSelect = (group) => {
    setSelectedGroup(group);
    setModalVisible(false);
  };

  return (
    <>
      <Tab.Navigator
        screenOptions={{
          headerTitle: username ? `Hallo, ${username}` : "",
          headerTitleAlign: "center",
          headerStyle: { backgroundColor: "#fff" },
          headerTitleStyle: { fontSize: 22 },

          headerLeft: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate("ProfileScreen")}
              style={{ marginLeft: 16 }}
            >
              <Icons.User2 size={24} color="#4FB6B8" />
            </TouchableOpacity>
          ),

          headerRight: () => (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <BringitsChip
                value={bringits}
                onPress={() => navigation.navigate("ProfileScreen")}
              />
              <LogoutButton />
            </View>
          ),
        }}
      >
        <Tab.Screen
          name="Meine Todos"
          component={MyTodosScreen}
          options={{
            tabBarIcon: ({ color }) => (
              <View style={{ width: 24, height: 24 }}>
                <Icons.Home size={24} color={color} />

                {hasAnyUnread && (
                  <View
                    style={{
                      position: "absolute",
                      top: -2,
                      right: -2,
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: "red",
                    }}
                  />
                )}
              </View>
            ),
          }}
        />

        <Tab.Screen
          name="Offene Todos"
          component={OpenTodosScreen}
          options={{
            tabBarIcon: ({ color }) => (
              <Icons.ClipboardList size={24} color={color} />
            ),
          }}
        />

        <Tab.Screen
          name="Todo erstellen"
          component={CreateTodoScreen}
          listeners={{
            tabPress: (e) => {
              if (!hasGroups) {
                e.preventDefault();
                Toast.show({
                  type: "info",
                  text1: "Keine Gruppe vorhanden!",
                  text2: "Erstelle eine Gruppe oder trete einer bei.",
                  visibilityTime: 4000,
                });
              }
            },
          }}
          options={{
            tabBarIcon: ({ color }) => (
              <Icons.PlusCircle
                size={24}
                color={hasGroups ? color : "#cccccc"}
                opacity={hasGroups ? 1 : 0.5}
              />
            ),
          }}
        />

        <Tab.Screen
          name="Meine Gruppen"
          component={MyGroups}
          options={{
            tabBarIcon: ({ color }) => (
              <Icons.Users size={24} color={color} />
            ),
          }}
        />
      </Tab.Navigator>

      <GroupCreationModal
        isVisible={isModalVisible}
        toggleModal={toggleModal}
        selectedGroup={selectedGroup}
        handleGroupSelect={handleGroupSelect}
        groups={groups}
      />
    </>
  );
}
