/**
 * Pantry Recipe Generator Screen
 * Wrapper screen for PantryRecipeGenerator component
 */

import React from "react";
import { RecipeStackScreenProps } from "../../navigation/types";
import PantryRecipeGenerator from "../../components/PantryRecipeGenerator";
import AppLayout from "../../components/layout/AppLayout";
import ScreenHeader from "../../components/layout/ScreenHeader";

type Props = RecipeStackScreenProps<"PantryGenerator">;

const PantryGeneratorScreen: React.FC<Props> = ({ navigation, route }) => {
  const handleRecipeGenerated = (recipeId: number) => {
    navigation.navigate("RecipeDetail", { id: recipeId });
  };

  const handleClose = () => {
    navigation.goBack();
  };

  return (
    <AppLayout scrollable={false}>
      <ScreenHeader
        title="Cook with What You Have"
        subtitle="Generate recipes from your pantry"
        onBackPress={handleClose}
      />
      <PantryRecipeGenerator
        onRecipeGenerated={handleRecipeGenerated}
        onClose={handleClose}
      />
    </AppLayout>
  );
};

export default PantryGeneratorScreen;
