import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { RecipeStackParamList } from "./types";
import RecipeListScreen from "../screens/Recipes/RecipeListScreen";
import RecipeDetailScreen from "../screens/Recipes/RecipeDetailScreen";
import CreateRecipeScreen from "../screens/Recipes/CreateRecipeScreen";

const Stack = createNativeStackNavigator<RecipeStackParamList>();

const RecipesNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="RecipeList"
      screenOptions={{
        headerStyle: {
          backgroundColor: "#6B8E23",
        },
        headerTintColor: "#fff",
        headerTitleStyle: {
          fontWeight: "bold",
        },
        animation: "fade",
      }}
    >
      <Stack.Screen
        name="RecipeList"
        component={RecipeListScreen}
        options={{ title: "Recipes" }}
      />
      <Stack.Screen
        name="RecipeDetail"
        component={RecipeDetailScreen}
        options={{ title: "Recipe Details" }}
      />
      <Stack.Screen
        name="CreateRecipe"
        component={CreateRecipeScreen}
        options={{ title: "Add Recipe" }}
      />
    </Stack.Navigator>
  );
};

export default RecipesNavigator;
