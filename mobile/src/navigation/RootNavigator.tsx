import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../contexts/AuthContext";
import { RootStackParamList } from "./types";
import LoginScreen from "../screens/Auth/LoginScreen";
import MainNavigator from "./MainNavigator";
import { SearchProvider } from "../contexts/SearchContext";
import { ActivityIndicator, View } from "react-native";

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootNavigator = () => {
  const auth = useAuth();
  
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
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#6B8E23" />
      </View>
    );
  }

  // Render different navigators based on auth state to avoid conditional children
  if (isAuthenticated) {
    return (
      <NavigationContainer>
        <SearchProvider>
          <Stack.Navigator
            screenOptions={{
              headerShown: false,
            }}
          >
            <Stack.Screen name="Main" component={MainNavigator} />
          </Stack.Navigator>
        </SearchProvider>
      </NavigationContainer>
    );
  }

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
};

export default RootNavigator;
