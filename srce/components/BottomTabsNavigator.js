import React, { useState, useEffect } from "react";
import { TouchableOpacity } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Home, ClipboardList, PlusCircle, Users, User2Icon } from "lucide-react-native";
import MyTodosScreen from "../components/MyTodosScreen";
import OpenTodosScreen from "../components/OpenTodosScreen";
import CreateTodoScreen from "../components/CreateTodoScreen";
import LogoutButton from "../components/LogoutButton";
import GroupCreationModal from "./GroupCreationModal";
import ProfileScreen from "../components/ProfileScreen";
import { jwtDecode } from "jwt-decode";
import * as SecureStore from "expo-secure-store";
import { useUser } from "../components/context/UserContext";
import MyGroups from "../components/MyGroups";
import Toast from "react-native-toast-message";
import { Text } from "react-native";

const Tab = createBottomTabNavigator();

export default function BottomTabsNavigator({ navigation }) {
  const { username, setUserId } = useUser();

  const [isModalVisible, setModalVisible] = useState(false);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [hasGroups, setHasGroups] = useState(false);

  // 🔄 Toggle Modal
  const toggleModal = () => {
    setModalVisible(!isModalVisible);
    fetchUserGroups(); // Neu laden, wenn Modal geöffnet wird
  };

  // 📡 User-ID anhand Username holen
  const fetchUserId = async (username, token) => {
    try {
      console.log("📡 Fetching User ID for:", username);

      const response = await fetch(
        `http://192.168.50.116:8082/api/users/username/${username}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) throw new Error(`Failed to fetch user ID. Status: ${response.status}`);

      const userData = await response.json();
      console.log("✅ Received User Data:", userData);

      if (!userData.user?.userId) throw new Error("User ID not found in response!");

      setUserId(userData.user.userId);
      return userData.user.userId;
    } catch (error) {
      console.error("❌ Error fetching user ID:", error);
      return null;
    }
  };

  // 📡 Gruppen anhand User-ID laden
  const fetchUserGroups = async () => {
    try {
      const token = await SecureStore.getItemAsync("authToken");
      if (!token) throw new Error("Token not found!");

      const decodedToken = jwtDecode(token);
      const username = decodedToken.sub;

      const userId = await fetchUserId(username, token);
      if (!userId) throw new Error("User ID lookup failed!");

      console.log(`📡 Fetching Groups for User ID: ${userId}`);

      const response = await fetch(
        `http://192.168.50.116:8082/api/groups/myGroups?userId=${userId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      console.log("✅ Fetched Groups:", JSON.stringify(data, null, 2));

      setGroups(data);
      setHasGroups(Array.isArray(data) && data.length > 0); // Sicher prüfen
    } catch (error) {
      console.error("❌ Error fetching groups:", error);
      setErrorMessage("Failed to fetch data. Please try again.");
      setHasGroups(false);
    }
  };

  // Gruppen sofort beim Start laden
  useEffect(() => {
    const init = async () => {
      console.log("🔁 Initial group fetch on BottomTabsNavigator mount");
      await fetchUserGroups();
    };
    init();
  }, [username]);

  const handleGroupSelect = (group) => {
    setSelectedGroup(group);
    setModalVisible(false);
  };

  return (
    <>
      <Tab.Navigator
        screenOptions={{
          headerRight: () => <LogoutButton navigation={navigation} />,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate("ProfileScreen")}
              style={{ marginLeft: 16 }}
            >
              <User2Icon size={24} color="#5fc9c9" />
            </TouchableOpacity>
          ),
          headerTitle: username ? `Hi, ${username}` : "Loading...",
          headerTitleAlign: "center",
        }}
      >
        <Tab.Screen
          name="MyTodos"
          component={MyTodosScreen}
          options={{
            tabBarIcon: ({ color }) => <Home size={24} color={color} />,
          }}
        />

        <Tab.Screen
          name="OpenTodos"
          component={OpenTodosScreen}
          options={{
            tabBarIcon: ({ color }) => <ClipboardList size={24} color={color} />,
          }}
        />

        {/* ✅ CreateTodo mit Gruppen-Check */}
        <Tab.Screen
          name="CreateTodo"
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
              <PlusCircle
                size={24}
                color={hasGroups ? color : "#cccccc"}
                opacity={hasGroups ? 1 : 0.5}
              />
            ),
          }}
        />

        <Tab.Screen
          name="MyGroups"
          component={MyGroups}
          options={{
            tabBarIcon: ({ color }) => <Users size={24} color={color} />,
          }}
        />
      </Tab.Navigator>

      {/* Group Modal */}
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
