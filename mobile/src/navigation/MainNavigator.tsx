import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { getFocusedRouteNameFromRoute } from "@react-navigation/native";
import { MainTabParamList } from "./types";
import HomeNavigator from "./HomeNavigator";
import RecipesNavigator from "./RecipesNavigator";
import ShoppingListsNavigator from "./ShoppingListsNavigator";
import IngredientsNavigator from "./IngredientsNavigator";
import MoreNavigator from "./MoreNavigator";
import { Ionicons } from "@expo/vector-icons";
import CustomTabBar from "../components/navigation/TabBar";

const Tab = createBottomTabNavigator<MainTabParamList>();

const MainNavigator = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === "Home") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "Recipes") {
            iconName = focused ? "restaurant" : "restaurant-outline";
          } else if (route.name === "ShoppingLists") {
            iconName = focused ? "cart" : "cart-outline";
          } else if (route.name === "Ingredients") {
            iconName = focused ? "leaf" : "leaf-outline";
          } else if (route.name === "Settings") {
            iconName = focused ? "settings" : "settings-outline";
          } else {
            iconName = "ellipse";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#6B8E23",
        tabBarInactiveTintColor: "gray",
        headerStyle: {
          backgroundColor: "#6B8E23",
        },
        headerTintColor: "#fff",
        headerTitleStyle: {
          fontWeight: "bold",
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeNavigator}
        options={{ title: "Dashboard" }}
      />
      <Tab.Screen
        name="Recipes"
        component={RecipesNavigator}
        options={{ headerShown: false, title: "Recipes" }}
        listeners={({ navigation, route }) => ({
          tabPress: (e) => {
            // Check if we're currently on RecipeDetail or CreateRecipe
            const routeName = getFocusedRouteNameFromRoute(route);
            // If we're not on RecipeList, navigate to it when tab is pressed
            if (routeName && routeName !== "RecipeList") {
              e.preventDefault();
              // Navigate to RecipeList within the Recipes stack
              (navigation as any).navigate("Recipes", {
                screen: "RecipeList",
                params: undefined,
              });
            }
          },
        })}
      />
      <Tab.Screen
        name="ShoppingLists"
        component={ShoppingListsNavigator}
        options={{ headerShown: false, title: "Shopping" }}
      />
      <Tab.Screen
        name="Ingredients"
        component={IngredientsNavigator}
        options={{ title: "Ingredients" }}
      />
      <Tab.Screen
        name="Settings"
        component={MoreNavigator}
        options={{ headerShown: false, title: "More" }}
      />
    </Tab.Navigator>
  );
};

export default MainNavigator;
