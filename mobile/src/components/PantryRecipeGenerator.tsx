/**
 * Pantry Recipe Generator Component
 * "Cook with What You Have" - Generate recipes from pantry ingredients
 */

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  ScrollView,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import GlassCard from "./GlassCard";
import GradientButton from "./GradientButton";
import { colors, spacing, typography, borderRadius, shadows, gradients } from "../styles/theme";
import { trpc } from "../api/trpc";
import { mediumImpact, successNotification } from "../utils/haptics";
import { useSubscription } from "../hooks/useSubscription";

interface PantryRecipeGeneratorProps {
  onRecipeGenerated?: (recipeId: number) => void;
  onClose?: () => void;
}

const PantryRecipeGenerator: React.FC<PantryRecipeGeneratorProps> = ({
  onRecipeGenerated,
  onClose,
}) => {
  const { isPremium } = useSubscription();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [manualIngredients, setManualIngredients] = useState<string[]>([]);
  const [currentIngredient, setCurrentIngredient] = useState("");
  const [maxCookingTime, setMaxCookingTime] = useState("");
  const [servings, setServings] = useState("");

  const generateMutation = trpc.recipes.generateFromPantry.useMutation({
    onSuccess: (recipe) => {
      successNotification();
      Alert.alert(
        "Recipe Generated!",
        `"${recipe.name}" has been created. No shopping needed!`,
        [
          {
            text: "View Recipe",
            onPress: () => {
              onRecipeGenerated?.(recipe.id);
              onClose?.();
            },
          },
          { text: "OK" },
        ]
      );
    },
    onError: (error) => {
      Alert.alert("Error", error.message || "Failed to generate recipe");
    },
  });

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Camera access is needed to scan your pantry."
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await mediumImpact();
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("[PantryRecipeGenerator] Error picking image:", error);
      Alert.alert("Error", "Failed to capture image. Please try again.");
    }
  };

  const pickFromLibrary = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Photo library access is needed to select pantry photos."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await mediumImpact();
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("[PantryRecipeGenerator] Error picking image:", error);
      Alert.alert("Error", "Failed to select image. Please try again.");
    }
  };

  const addIngredient = () => {
    const trimmed = currentIngredient.trim();
    if (trimmed && !manualIngredients.includes(trimmed)) {
      setManualIngredients([...manualIngredients, trimmed]);
      setCurrentIngredient("");
    }
  };

  const removeIngredient = (ingredient: string) => {
    setManualIngredients(manualIngredients.filter((ing) => ing !== ingredient));
  };

  const handleGenerate = async () => {
    if (!selectedImage && manualIngredients.length === 0) {
      Alert.alert(
        "Add Ingredients",
        "Please take a photo of your pantry or add ingredients manually."
      );
      return;
    }

    // Upload image if provided
    let imageUrl: string | undefined;
    if (selectedImage) {
      try {
        // Get upload URL
        const uploadUrl = await trpc.ingredients.getUploadUrl.mutate({
          fileName: `pantry-${Date.now()}.jpg`,
          contentType: "image/jpeg",
        });

        // Upload image (simplified - in production, use proper upload)
        // For now, we'll use the local URI and let the backend handle it
        imageUrl = selectedImage;
      } catch (error) {
        console.error("[PantryRecipeGenerator] Error uploading image:", error);
      }
    }

    generateMutation.mutate({
      imageUrl,
      ingredients: manualIngredients.length > 0 ? manualIngredients : undefined,
      maxCookingTime: maxCookingTime ? parseInt(maxCookingTime, 10) : undefined,
      servings: servings ? parseInt(servings, 10) : undefined,
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Cook with What You Have</Text>
        <Text style={styles.subtitle}>
          Take a photo of your pantry or add ingredients to generate a recipe
        </Text>
      </View>

      {/* Camera Section */}
      <GlassCard style={styles.card}>
        <Text style={styles.sectionTitle}>Scan Your Pantry</Text>
        {selectedImage ? (
          <View style={styles.imageContainer}>
            <Image source={{ uri: selectedImage }} style={styles.previewImage} />
            <TouchableOpacity
              style={styles.removeImageButton}
              onPress={() => setSelectedImage(null)}
            >
              <Ionicons name="close-circle" size={24} color={colors.error} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.imageButtons}>
            <TouchableOpacity
              style={styles.imageButton}
              onPress={pickImage}
            >
              <LinearGradient
                colors={gradients.primary}
                style={styles.imageButtonGradient}
              >
                <Ionicons name="camera" size={32} color={colors.text.inverse} />
                <Text style={styles.imageButtonText}>Take Photo</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.imageButton}
              onPress={pickFromLibrary}
            >
              <LinearGradient
                colors={gradients.secondary}
                style={styles.imageButtonGradient}
              >
                <Ionicons name="images" size={32} color={colors.text.inverse} />
                <Text style={styles.imageButtonText}>Choose Photo</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </GlassCard>

      {/* Manual Ingredients */}
      <GlassCard style={styles.card}>
        <Text style={styles.sectionTitle}>Or Add Ingredients Manually</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="e.g., tomatoes, pasta, cheese"
            value={currentIngredient}
            onChangeText={setCurrentIngredient}
            onSubmitEditing={addIngredient}
            returnKeyType="done"
          />
          <TouchableOpacity
            style={styles.addButton}
            onPress={addIngredient}
            disabled={!currentIngredient.trim()}
          >
            <Ionicons
              name="add-circle"
              size={28}
              color={
                currentIngredient.trim()
                  ? colors.olive
                  : colors.text.tertiary
              }
            />
          </TouchableOpacity>
        </View>

        {manualIngredients.length > 0 && (
          <View style={styles.ingredientsList}>
            {manualIngredients.map((ingredient, index) => (
              <View key={index} style={styles.ingredientTag}>
                <Text style={styles.ingredientText}>{ingredient}</Text>
                <TouchableOpacity
                  onPress={() => removeIngredient(ingredient)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name="close-circle"
                    size={18}
                    color={colors.text.secondary}
                  />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </GlassCard>

      {/* Options */}
      <GlassCard style={styles.card}>
        <Text style={styles.sectionTitle}>Recipe Options</Text>
        <View style={styles.optionsRow}>
          <View style={styles.option}>
            <Text style={styles.optionLabel}>Max Cooking Time (min)</Text>
            <TextInput
              style={styles.optionInput}
              placeholder="30"
              keyboardType="number-pad"
              value={maxCookingTime}
              onChangeText={setMaxCookingTime}
            />
          </View>
          <View style={styles.option}>
            <Text style={styles.optionLabel}>Servings</Text>
            <TextInput
              style={styles.optionInput}
              placeholder="4"
              keyboardType="number-pad"
              value={servings}
              onChangeText={setServings}
            />
          </View>
        </View>
      </GlassCard>

      {/* Generate Button */}
      <GradientButton
        title={
          generateMutation.isPending
            ? "Generating Recipe..."
            : "Generate Recipe (No Shopping Needed!)"
        }
        onPress={handleGenerate}
        disabled={generateMutation.isPending}
        style={styles.generateButton}
      />

      {generateMutation.isPending && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.olive} />
          <Text style={styles.loadingText}>
            Analyzing your ingredients and creating a recipe...
          </Text>
        </View>
      )}

      {/* Info */}
      <View style={styles.infoCard}>
        <Ionicons name="information-circle" size={20} color={colors.info} />
        <Text style={styles.infoText}>
          AI will generate a recipe using only the ingredients you have. No
          shopping required!
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  header: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize.xxxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
    lineHeight: typography.lineHeight.relaxed * typography.fontSize.md,
  },
  card: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  imageContainer: {
    position: "relative",
    borderRadius: borderRadius.md,
    overflow: "hidden",
  },
  previewImage: {
    width: "100%",
    height: 200,
    borderRadius: borderRadius.md,
  },
  removeImageButton: {
    position: "absolute",
    top: spacing.xs,
    right: spacing.xs,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: borderRadius.full,
  },
  imageButtons: {
    flexDirection: "row",
    gap: spacing.md,
  },
  imageButton: {
    flex: 1,
    borderRadius: borderRadius.md,
    overflow: "hidden",
    ...shadows.medium,
  },
  imageButtonGradient: {
    padding: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 120,
  },
  imageButtonText: {
    color: colors.text.inverse,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    marginTop: spacing.xs,
  },
  inputRow: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "center",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.fontSize.md,
    color: colors.text.primary,
  },
  addButton: {
    padding: spacing.sm,
  },
  ingredientsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  ingredientTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.olive + "20",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  ingredientText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.medium,
  },
  optionsRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  option: {
    flex: 1,
  },
  optionLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  optionInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.fontSize.md,
    color: colors.text.primary,
  },
  generateButton: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  loadingOverlay: {
    alignItems: "center",
    marginTop: spacing.lg,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    textAlign: "center",
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    backgroundColor: colors.info + "10",
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
  },
  infoText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    lineHeight: typography.lineHeight.relaxed * typography.fontSize.sm,
  },
});

export default PantryRecipeGenerator;
