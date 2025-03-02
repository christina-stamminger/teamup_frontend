import React, { useState } from "react";
import { TouchableOpacity } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Home, ClipboardList, PlusCircle, Users } from "lucide-react-native";
import MyTodosScreen from "../components/MyTodosScreen";
import OpenTodosScreen from "../components/OpenTodosScreen";
import CreateTodoScreen from "../components/CreateTodoScreen";
import LogoutButton from "../components/LogoutButton";
import GroupModal from "../components/GroupModal";

import { jwtDecode } from "jwt-decode";
import * as SecureStore from "expo-secure-store";

import { useUser } from "../components/context/UserContext"; // Import the useUser hook for userID, create context to make it globally accessible


const Tab = createBottomTabNavigator();

export default function BottomTabsNavigator({ navigation }) {
  const { setUserId } = useUser(); // Get the setter for userId

  const [isModalVisible, setModalVisible] = useState(false);
  const [groups, setGroups] = useState([]); // Store fetched groups
  const [selectedGroup, setSelectedGroup] = useState("");
  const [errorMessage, setErrorMessage] = useState(""); // For error messages

  const toggleModal = () => {
    setModalVisible(!isModalVisible);
    fetchUserGroups(); // Fetch groups when modal is toggled
  };

  // Fetch User ID from Backend using Username
  const fetchUserId = async (username, token) => {
    try {
      console.log("📡 Fetching User ID for:", username);
  
      const response = await fetch(`http://192.168.50.116:8082/api/users/username/${username}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
  
      if (!response.ok) throw new Error(`Failed to fetch user ID. Status: ${response.status}`);
  
      const userData = await response.json();
      console.log("Received User Data:", userData);
  
      if (!userData.user || !userData.user.userId) {
        throw new Error("User ID not found in response!");
      }
  
      setUserId(userData.user.userId); // Set the userId in the context (to make it globally accessible)

      return userData.user.userId; // Correctly accessing userId
    } catch (error) {
      console.error("Error fetching user ID:", error);
      return null;
    }
  };
  

  // Fetch Groups Using User ID
  const fetchUserGroups = async () => {
    try {
      const token = await SecureStore.getItemAsync("authToken");
      if (!token) throw new Error("Token not found!");

      // Decode Token
      const decodedToken = jwtDecode(token);
      const username = decodedToken.sub; // Extract username

      console.log("Decoded Token:", JSON.stringify(decodedToken, null, 2));
      console.log("Extracted Username:", username);

      // Fetch User ID from backend
      const userId = await fetchUserId(username, token);
      if (!userId) throw new Error("User ID lookup failed!");

      // Fetch groups using User ID
      console.log(`Fetching Groups for User ID: ${userId}`);

      const response = await fetch(`http://192.168.50.116:8082/api/groups/myGroups?userId=${userId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      console.log("Fetched Groups:", JSON.stringify(data, null, 2));
      setGroups(data);
    } catch (error) {
      console.error("Error fetching groups:", error);
      setErrorMessage("Failed to fetch data. Please try again.");
    }
  };

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
            <TouchableOpacity onPress={toggleModal} style={{ marginLeft: 16 }}>
              <Users size={24} color="#5FC9C9" />
            </TouchableOpacity>
          ),
          headerTitle: "BringIt",
          headerTitleAlign: "center",
        }}
      >
        <Tab.Screen name="MyTodos" component={MyTodosScreen} options={{ tabBarIcon: ({ color }) => <Home size={24} color={color} /> }} />
        <Tab.Screen name="OpenTodos" component={OpenTodosScreen} options={{ tabBarIcon: ({ color }) => <ClipboardList size={24} color={color} /> }} />
        <Tab.Screen name="CreateTodo" component={CreateTodoScreen} options={{ tabBarIcon: ({ color }) => <PlusCircle size={24} color={color} /> }} />
      </Tab.Navigator>

      {/* Group Modal */}
      <GroupModal
        isVisible={isModalVisible}
        toggleModal={toggleModal}
        selectedGroup={selectedGroup}
        handleGroupSelect={handleGroupSelect}
        groups={groups} // Pass the fetched groups to the modal
      />
    </>
  );
}
