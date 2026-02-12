import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { RecipeStackParamList } from "./types";
import { createLazyScreen } from "../utils/lazyScreen";

// Eager load - initial screen
import RecipeListScreen from "../screens/Recipes/RecipeListScreen";

// Lazy load - secondary screens
const RecipeDetailScreen = createLazyScreen(
  () => import("../screens/Recipes/RecipeDetailScreen")
);
const CreateRecipeScreen = createLazyScreen(
  () => import("../screens/Recipes/CreateRecipeScreen")
);
const PantryRecipeGeneratorScreen = createLazyScreen(
  () => import("../screens/Recipes/PantryGeneratorScreen")
);

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
      <Stack.Screen
        name="PantryGenerator"
        component={PantryRecipeGeneratorScreen}
        options={{ title: "Cook with What You Have" }}
      />
    </Stack.Navigator>
  );
};

export default RecipesNavigator;
