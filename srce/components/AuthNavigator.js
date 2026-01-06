import React from "react";
import { createStackNavigator } from "@react-navigation/stack";

import LoginScreen from "../components/LoginScreen";
import RegisterScreen from "../components/RegisterScreen";
import ForgotPasswordScreen from "../components/ForgotPasswordScreen";
import ResetPasswordScreen from "../components/ResetPasswordScreen";
import SetNewPasswordScreen from "../components/SetNewPasswordScreen";


const Stack = createStackNavigator();

export default function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="SetNewPassword" component={SetNewPasswordScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
    </Stack.Navigator>
  );
}
