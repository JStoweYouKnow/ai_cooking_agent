import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../contexts/AuthContext";
import { RootStackParamList } from "./types";
import LoginScreen from "../screens/Auth/LoginScreen";
import MainNavigator from "./MainNavigator";
import DemoBanner from "../components/DemoBanner";
import { ActivityIndicator, View, Text } from "react-native";

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootNavigator = () => {
  console.log("[RootNavigator] Component rendering...");
  
  let auth;
  try {
    console.log("[RootNavigator] Attempting to use auth context...");
    auth = useAuth();
    console.log("[RootNavigator] Auth context retrieved successfully");
  } catch (error) {
    console.error("[RootNavigator] Error accessing auth context:", error);
    // Return a fallback UI if auth context fails
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F5F5F0" }}>
        <Text style={{ fontSize: 16, color: "#666", marginBottom: 8 }}>Authentication Error</Text>
        <Text style={{ fontSize: 12, color: "#999" }}>Please restart the app</Text>
      </View>
    );
  }
  
  // Extract boolean values and ensure they're primitive booleans
  // Use Boolean() constructor to force primitive boolean type
  const isLoading = Boolean(auth.isLoading);
  const isAuthenticated = Boolean(auth.isAuthenticated);
  
  // Debug logging
  console.log("[RootNavigator] Auth state:", { 
    isLoading, 
    isAuthenticated, 
    hasUser: Boolean(auth.user),
    userId: auth.user?.id 
  });

  if (isLoading) {
    console.log("[RootNavigator] Showing loading indicator");
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F5F5F0" }}>
        <ActivityIndicator size="large" color="#6B8E23" />
        <Text style={{ marginTop: 16, color: "#666", fontSize: 14 }}>Loading...</Text>
      </View>
    );
  }

  // Render different navigators based on auth state to avoid conditional children
  if (isAuthenticated) {
    console.log("[RootNavigator] User is authenticated, rendering MainNavigator");
    try {
      return (
        <View style={{ flex: 1 }}>
          <DemoBanner />
          <NavigationContainer>
            <Stack.Navigator
              screenOptions={{
                headerShown: false,
              }}
            >
              <Stack.Screen name="Main" component={MainNavigator} />
            </Stack.Navigator>
          </NavigationContainer>
        </View>
      );
    } catch (error) {
      console.error("[RootNavigator] Error rendering authenticated navigator:", error);
      return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F5F5F0" }}>
          <Text style={{ fontSize: 16, color: "#666" }}>Navigation Error</Text>
          <Text style={{ fontSize: 12, color: "#999", marginTop: 8 }}>Please restart the app</Text>
        </View>
      );
    }
  }

  console.log("[RootNavigator] User is not authenticated, rendering LoginScreen");
  try {
    return (
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="Login" component={LoginScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  } catch (error) {
    console.error("[RootNavigator] Error rendering login navigator:", error);
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F5F5F0" }}>
        <Text style={{ fontSize: 16, color: "#666" }}>Navigation Error</Text>
        <Text style={{ fontSize: 12, color: "#999", marginTop: 8 }}>Please restart the app</Text>
      </View>
    );
  }
};

export default RootNavigator;
