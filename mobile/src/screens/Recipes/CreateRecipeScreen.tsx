import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { RecipeStackScreenProps } from "../../navigation/types";
import { trpc } from "../../api/trpc";
import GradientButton from "../../components/GradientButton";
import GlassCard from "../../components/GlassCard";
import EmptyState from "../../components/EmptyState";
import { addBreadcrumb } from "../../utils/analytics";
import AppLayout from "../../components/layout/AppLayout";
import ScreenHeader from "../../components/layout/ScreenHeader";
import { colors, spacing, typography, borderRadius } from "../../styles/theme";

type Props = RecipeStackScreenProps<"CreateRecipe">;

type Method = "manual" | "url" | "photo" | null;
type Step = 1 | 2 | 3 | 4 | 5;

interface Ingredient {
  id: string;
  name: string;
  quantity: string;
  unit: string;
}

const CreateRecipeScreen: React.FC<Props> = ({ navigation, route }) => {
  const initialUrl = route.params?.initialUrl ?? "";

  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [method, setMethod] = useState<Method>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);

  // Step 2: Basic Info
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  // Step 3: Ingredients
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [newIngredient, setNewIngredient] = useState({ name: "", quantity: "", unit: "" });

  // Step 4: Instructions
  const [instructions, setInstructions] = useState("");

  // Step 5: Meta
  const [cuisine, setCuisine] = useState("");
  const [cookingTime, setCookingTime] = useState("");
  const [servings, setServings] = useState("");

  // URL import (pre-filled when navigating from creator featured)
  const [importUrl, setImportUrl] = useState(initialUrl);

  useEffect(() => {
    if (initialUrl) setImportUrl(initialUrl);
  }, [initialUrl]);

  const utils = trpc.useUtils();
  const createRecipe = trpc.recipes.create.useMutation({
    onSuccess: () => {
      utils.recipes.list.invalidate();
      Alert.alert("Success", "Recipe created successfully!", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to create recipe");
    },
  });

  const parseFromUrl = trpc.recipes.parseFromUrl.useMutation({
    onSuccess: (response: any) => {
      addBreadcrumb("import", "CreateRecipe: URL parsed", { hasName: !!response?.parsed?.name });
      // The response contains { parsed: { ... } } when autoSave is false
      const data = response.parsed || response;

      console.log("[CreateRecipe] Parse from URL success:", {
        hasName: !!data.name,
        hasDescription: !!data.description,
        hasInstructions: !!data.instructions,
        ingredientsCount: data.ingredients?.length || 0,
      });

      if (data.name) setName(data.name);
      if (data.description) setDescription(data.description);
      if (data.instructions) setInstructions(data.instructions);
      if (data.cuisine) setCuisine(data.cuisine);
      if (data.cookingTime) setCookingTime(String(data.cookingTime));
      if (data.servings) setServings(String(data.servings));
      if (data.ingredients && Array.isArray(data.ingredients)) {
        setIngredients(
          data.ingredients.map((ing: any, idx: number) => ({
            id: `ing-${idx}`,
            name: ing.name || ing.ingredientName || "",
            quantity: ing.quantity || "",
            unit: ing.unit || "",
          }))
        );
      }
      setCurrentStep(2);
      Alert.alert("Success", "Recipe parsed from URL! Review and edit the details.");
    },
    onError: (error: any) => {
      console.error("[CreateRecipe] Parse from URL error:", {
        message: error.message,
        data: error.data,
        cause: error.cause,
        stack: error.stack,
      });
      
      // Extract more detailed error message
      let errorMessage = error.message || "Failed to parse recipe from URL";
      
      // If it's a network error, provide helpful guidance
      if (errorMessage.includes("Network request failed") || errorMessage.includes("timeout")) {
        errorMessage = "Unable to connect to the server. Please check your internet connection and try again.";
      } else if (errorMessage.includes("Failed to parse recipe from URL")) {
        // The server now provides more details in the error message
        errorMessage = errorMessage;
      }
      
      Alert.alert(
        "Import Failed", 
        errorMessage,
        [
          { text: "OK" },
          { 
            text: "View Details", 
            onPress: () => {
              console.log("Full error details:", JSON.stringify(error, null, 2));
            }
          }
        ]
      );
    },
  });

  const handleMethodSelect = (selectedMethod: Method) => {
    setMethod(selectedMethod);
    if (selectedMethod === "url") {
      setCurrentStep(2);
    } else if (selectedMethod === "photo") {
      handlePickImage();
    } else {
      setCurrentStep(2);
    }
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please grant camera roll access to upload photos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setMethod("photo");
      setCurrentStep(2);
    }
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please grant camera access to take photos.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setMethod("photo");
      setCurrentStep(2);
    }
  };

  const handleAddIngredient = () => {
    if (!newIngredient.name.trim()) {
      Alert.alert("Required", "Please enter an ingredient name");
      return;
    }
    setIngredients([
      ...ingredients,
      {
        id: `ing-${Date.now()}`,
        name: newIngredient.name.trim(),
        quantity: newIngredient.quantity.trim(),
        unit: newIngredient.unit.trim(),
      },
    ]);
    setNewIngredient({ name: "", quantity: "", unit: "" });
  };

  const handleRemoveIngredient = (id: string) => {
    setIngredients(ingredients.filter((ing) => ing.id !== id));
  };

  const handleNext = () => {
    if (currentStep === 1 && !method) {
      Alert.alert("Select Method", "Please choose how you'd like to create this recipe");
      return;
    }
    if (currentStep === 2 && !name.trim()) {
      Alert.alert("Required", "Please enter a recipe name");
      return;
    }
    if (currentStep < 5) {
      setCurrentStep((prev) => (prev + 1) as Step);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as Step);
    } else {
      navigation.goBack();
    }
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      Alert.alert("Required", "Please enter a recipe name");
      return;
    }

    const trimmedInstructions = instructions.trim() || undefined;
    const trimmedDescription = description.trim() || undefined;
    const trimmedCuisine = cuisine.trim() || undefined;

    createRecipe.mutate({
      name: name.trim(),
      description: trimmedDescription,
      instructions: trimmedInstructions,
      cuisine: trimmedCuisine,
      cookingTime: cookingTime ? parseInt(cookingTime, 10) : undefined,
      servings: servings ? parseInt(servings, 10) : undefined,
      imageUrl: imageUri || undefined,
    });
  };

  const handleUrlImport = async (url: string) => {
    if (!url.trim()) {
      Alert.alert("Required", "Please enter a recipe URL");
      return;
    }
    try {
      new URL(url.trim());
    } catch {
      Alert.alert("Invalid URL", "Please enter a valid URL");
      return;
    }
    parseFromUrl.mutate({ url: url.trim(), autoSave: false });
  };

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Choose Creation Method</Text>
      <Text style={styles.stepDescription}>How would you like to create this recipe?</Text>

      <TouchableOpacity
        style={styles.methodCard}
        onPress={() => handleMethodSelect("manual")}
        accessibilityRole="button"
        accessibilityLabel="Create recipe manually"
      >
        <Ionicons name="create-outline" size={32} color={colors.olive} />
        <Text style={styles.methodTitle}>Manual Entry</Text>
        <Text style={styles.methodDescription}>Fill out the recipe form step by step</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.methodCard}
        onPress={() => handleMethodSelect("url")}
        accessibilityRole="button"
        accessibilityLabel="Import recipe from URL"
      >
        <Ionicons name="link-outline" size={32} color={colors.russet} />
        <Text style={styles.methodTitle}>Import from URL</Text>
        <Text style={styles.methodDescription}>Paste a recipe URL to auto-fill details</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.methodCard}
        onPress={handlePickImage}
        accessibilityRole="button"
        accessibilityLabel="Upload recipe photo"
      >
        <Ionicons name="image-outline" size={32} color={colors.navy} />
        <Text style={styles.methodTitle}>Upload Photo</Text>
        <Text style={styles.methodDescription}>Take or select a photo of a recipe</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.methodCard, styles.methodCardSecondary]}
        onPress={handleTakePhoto}
        accessibilityRole="button"
        accessibilityLabel="Take recipe photo"
      >
        <Ionicons name="camera-outline" size={24} color={colors.text.secondary} />
        <Text style={styles.methodTitleSecondary}>Or take a photo</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep2 = () => {
    if (method === "url") {
      return (
        <View style={styles.stepContent}>
          <Text style={styles.stepTitle}>Import from URL</Text>
          <Text style={styles.stepDescription}>Paste a recipe URL to automatically import details</Text>
          <TextInput
            style={styles.input}
            placeholder="https://example.com/recipe"
            value={importUrl}
            onChangeText={setImportUrl}
            autoCapitalize="none"
            keyboardType="url"
            autoCorrect={false}
          />
          <GradientButton
            title={parseFromUrl.isPending ? "Importing..." : "Import Recipe"}
            onPress={() => handleUrlImport(importUrl)}
            disabled={parseFromUrl.isPending}
            loading={parseFromUrl.isPending}
            style={{ marginTop: spacing.md }}
          />
          {parseFromUrl.isError ? (
            <EmptyState
              variant="error"
              title="Import failed"
              description={parseFromUrl.error?.message ?? "Couldn't load that recipe. Check the URL and try again."}
              primaryActionLabel="Retry"
              onPrimaryAction={() => importUrl.trim() && parseFromUrl.mutate({ url: importUrl.trim(), autoSave: false })}
              style={{ marginTop: spacing.md }}
            />
          ) : null}
          <TouchableOpacity onPress={() => setMethod("manual")} style={styles.switchMethod}>
            <Text style={styles.switchMethodText}>Or create manually instead</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>Basic Information</Text>
        <Text style={styles.stepDescription}>Tell us about your recipe</Text>

        {imageUri && (
          <View style={styles.imagePreview}>
            <Image source={{ uri: imageUri }} style={styles.previewImage} />
            <TouchableOpacity
              style={styles.removeImage}
              onPress={() => setImageUri(null)}
              accessibilityRole="button"
              accessibilityLabel="Remove image"
            >
              <Ionicons name="close-circle" size={24} color={colors.error} />
            </TouchableOpacity>
          </View>
        )}

        {!imageUri && method === "photo" && (
          <TouchableOpacity style={styles.imagePlaceholder} onPress={handlePickImage}>
            <Ionicons name="image-outline" size={48} color={colors.text.secondary} />
            <Text style={styles.imagePlaceholderText}>Tap to add recipe image</Text>
          </TouchableOpacity>
        )}

        <View style={styles.field}>
          <Text style={styles.label}>Recipe Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Chicken Parmesan"
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="A brief description of this recipe..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />
        </View>
      </View>
    );
  };

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Ingredients</Text>
      <Text style={styles.stepDescription}>Add ingredients with quantities</Text>

      <View style={styles.ingredientInputRow}>
        <TextInput
          style={[styles.input, styles.ingredientNameInput]}
          placeholder="Ingredient name *"
          value={newIngredient.name}
          onChangeText={(text) => setNewIngredient({ ...newIngredient, name: text })}
        />
        <TextInput
          style={[styles.input, styles.ingredientQtyInput]}
          placeholder="Qty"
          value={newIngredient.quantity}
          onChangeText={(text) => setNewIngredient({ ...newIngredient, quantity: text })}
          keyboardType="decimal-pad"
        />
        <TextInput
          style={[styles.input, styles.ingredientUnitInput]}
          placeholder="Unit"
          value={newIngredient.unit}
          onChangeText={(text) => setNewIngredient({ ...newIngredient, unit: text })}
        />
        <TouchableOpacity
          style={styles.addIngredientButton}
          onPress={handleAddIngredient}
          accessibilityRole="button"
          accessibilityLabel="Add ingredient"
        >
          <Ionicons name="add" size={24} color={colors.text.inverse} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.ingredientsList}>
        {ingredients.map((ing) => (
          <View key={ing.id} style={styles.ingredientItem}>
            <View style={styles.ingredientInfo}>
              <Text style={styles.ingredientName}>{ing.name}</Text>
              {(ing.quantity || ing.unit) && (
                <Text style={styles.ingredientMeta}>
                  {[ing.quantity, ing.unit].filter(Boolean).join(" ")}
                </Text>
              )}
            </View>
            <TouchableOpacity
              onPress={() => handleRemoveIngredient(ing.id)}
              accessibilityRole="button"
              accessibilityLabel={`Remove ${ing.name}`}
            >
              <Ionicons name="trash-outline" size={20} color={colors.error} />
            </TouchableOpacity>
          </View>
        ))}
        {ingredients.length === 0 && (
          <Text style={styles.emptyText}>No ingredients added yet. Add your first ingredient above.</Text>
        )}
      </ScrollView>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Instructions</Text>
      <Text style={styles.stepDescription}>Write step-by-step cooking instructions</Text>
      <TextInput
        style={[styles.input, styles.instructionsInput]}
        placeholder="Step 1: Prepare ingredients...&#10;Step 2: Heat pan...&#10;Step 3: Add ingredients..."
        value={instructions}
        onChangeText={setInstructions}
        multiline
        numberOfLines={12}
        textAlignVertical="top"
      />
      <Text style={styles.hintText}>Each line will be treated as a separate step</Text>
    </View>
  );

  const renderStep5 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Additional Details</Text>
      <Text style={styles.stepDescription}>Add optional metadata</Text>

      <View style={styles.field}>
        <Text style={styles.label}>Cuisine</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Italian, Mexican, Asian"
          value={cuisine}
          onChangeText={setCuisine}
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.field, styles.halfField]}>
          <Text style={styles.label}>Cooking Time (minutes)</Text>
          <TextInput
            style={styles.input}
            placeholder="30"
            value={cookingTime}
            onChangeText={setCookingTime}
            keyboardType="number-pad"
          />
        </View>
        <View style={[styles.field, styles.halfField]}>
          <Text style={styles.label}>Servings</Text>
          <TextInput
            style={styles.input}
            placeholder="4"
            value={servings}
            onChangeText={setServings}
            keyboardType="number-pad"
          />
        </View>
      </View>
    </View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      case 5:
        return renderStep5();
      default:
        return null;
    }
  };

  const stepTitles = ["Method", "Basic Info", "Ingredients", "Instructions", "Details"];

  return (
    <AppLayout style={styles.screen}>
      <ScreenHeader
        title={`Create Recipe (${currentStep}/5)`}
        subtitle={stepTitles[currentStep - 1]}
        actionLabel={currentStep === 1 ? "Cancel" : "Back"}
        onActionPress={handleBack}
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.progressBar}>
          {[1, 2, 3, 4, 5].map((step) => (
            <View
              key={step}
              style={[
                styles.progressDot,
                step <= currentStep && styles.progressDotActive,
                step < currentStep && styles.progressDotCompleted,
              ]}
            />
          ))}
        </View>

        <GlassCard style={styles.card}>{renderCurrentStep()}</GlassCard>
      </ScrollView>

      <View style={styles.footer}>
        <GradientButton
          title={currentStep === 5 ? "Create Recipe" : "Next"}
          onPress={handleNext}
          disabled={createRecipe.isPending}
          loading={createRecipe.isPending}
          style={styles.footerButton}
        />
      </View>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  progressBar: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.md,
    marginHorizontal: spacing.md,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.glass.border,
  },
  progressDotActive: {
    backgroundColor: colors.olive,
  },
  progressDotCompleted: {
    backgroundColor: colors.olive,
    opacity: 0.6,
  },
  card: {
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    padding: spacing.lg,
  },
  stepContent: {
    gap: spacing.md,
  },
  stepTitle: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.navy,
    marginBottom: spacing.xs,
  },
  stepDescription: {
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
  },
  methodCard: {
    backgroundColor: colors.glass.background,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.glass.border,
    marginBottom: spacing.md,
  },
  methodCardSecondary: {
    borderStyle: "dashed",
    borderWidth: 1,
  },
  methodTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.navy,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  methodTitleSecondary: {
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  methodDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    textAlign: "center",
  },
  field: {
    marginBottom: spacing.md,
  },
  halfField: {
    flex: 1,
  },
  row: {
    flexDirection: "row",
    gap: spacing.md,
  },
  label: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.navy,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.glass.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.fontSize.md,
    color: colors.text.primary,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  instructionsInput: {
    minHeight: 200,
  },
  imagePreview: {
    position: "relative",
    marginBottom: spacing.md,
  },
  previewImage: {
    width: "100%",
    height: 200,
    borderRadius: borderRadius.md,
    resizeMode: "cover",
  },
  removeImage: {
    position: "absolute",
    top: spacing.xs,
    right: spacing.xs,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: borderRadius.full,
  },
  imagePlaceholder: {
    width: "100%",
    height: 200,
    backgroundColor: colors.glass.background,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.glass.border,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  imagePlaceholderText: {
    marginTop: spacing.sm,
    color: colors.text.secondary,
    fontSize: typography.fontSize.sm,
  },
  ingredientInputRow: {
    flexDirection: "row",
    gap: spacing.xs,
    marginBottom: spacing.md,
    alignItems: "flex-start",
  },
  ingredientNameInput: {
    flex: 2,
  },
  ingredientQtyInput: {
    flex: 1,
  },
  ingredientUnitInput: {
    flex: 1,
  },
  addIngredientButton: {
    backgroundColor: colors.olive,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 48,
    minHeight: 48,
  },
  ingredientsList: {
    maxHeight: 300,
  },
  ingredientItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.glass.background,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
  },
  ingredientInfo: {
    flex: 1,
  },
  ingredientName: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
  },
  ingredientMeta: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: spacing.xs / 2,
  },
  emptyText: {
    textAlign: "center",
    color: colors.text.secondary,
    fontStyle: "italic",
    padding: spacing.lg,
  },
  hintText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    marginTop: spacing.xs,
    fontStyle: "italic",
  },
  switchMethod: {
    marginTop: spacing.md,
    padding: spacing.sm,
  },
  switchMethodText: {
    color: colors.olive,
    fontSize: typography.fontSize.sm,
    textAlign: "center",
  },
  footer: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.glass.border,
  },
  footerButton: {
    width: "100%",
  },
});

export default CreateRecipeScreen;
