import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { NavigationContainer } from "@react-navigation/native";
import LoginScreen from "../components/LoginScreen";
import ForgotPasswordScreen from "../components/ForgotPasswordScreen";
import ResetPasswordScreen from "../components/ResetPasswordScreen";
import RegisterScreen from "../components/RegisterScreen";
import BottomTabsNavigator from "./BottomTabsNavigator";
import ProfileScreen from "../components/ProfileScreen";
import MyTodosScreen from "../components/MyTodosScreen";
import MyGroups from "../components/MyGroups";
import GroupDetails from "../components/GroupDetails";
import * as Linking from "expo-linking";

import SetNewPasswordScreen from "../components/SetNewPasswordScreen";

const Stack = createStackNavigator();

// ✅ Deep linking config
export const linking = {
  prefixes: [
    "bringit://",              // Custom scheme (e.g. deep links)
    Linking.createURL("/"),    // Needed for development (Expo Go)
  ],
  config: {
    screens: {
      Login: "login",
      ForgotPassword: "forgot-password",
      ResetPassword: {
        path: "reset-password",
        parse: {
          token: (token) => `${token}`, // optional, but useful for typing
        },
      },
      SetNewPassword: {
        path: "set-new-password",
        parse: { token: (token) => `${token}` }, // Optional, falls Token als Query mitkommt
      },
      Register: "register",
      HomeTabs: {
        screens: {
          MyTodosScreen: "todos",
          MyGroups: "groups",
          ProfileScreen: "profile",
        },
      },
      GroupDetails: "group/:id", // parameterized route
    },
  },
};

export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="SetNewPassword" component={SetNewPasswordScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="HomeTabs" component={BottomTabsNavigator} />
      <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
      <Stack.Screen name="MyTodosScreen" component={MyTodosScreen} />
      <Stack.Screen name="MyGroups" component={MyGroups} />
      <Stack.Screen name="GroupDetails" component={GroupDetails} />
    </Stack.Navigator>
  );
}
