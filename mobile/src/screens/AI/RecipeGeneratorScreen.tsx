import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, TextInput, Alert } from "react-native";
import { trpc } from "../../api/trpc";
import AppLayout from "../../components/layout/AppLayout";
import ScreenHeader from "../../components/layout/ScreenHeader";
import GradientButton from "../../components/GradientButton";
import GlassCard from "../../components/GlassCard";
import LoadingSkeleton from "../../components/LoadingSkeleton";
import { colors, spacing, typography, borderRadius } from "../../styles/theme";
import { MoreStackScreenProps } from "../../navigation/types";

type Props = MoreStackScreenProps<"RecipeGenerator">;

const RecipeGeneratorScreen: React.FC<Props> = ({ navigation }) => {
  const [prompt, setPrompt] = useState("");
  const [ingredientsInput, setIngredientsInput] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [servings, setServings] = useState("");

  const generateRecipe = trpc.ai.generateRecipe.useMutation({
    onError: (error) => {
      Alert.alert("Unable to generate recipe", error.message || "Please try again.");
    },
  });

  const parsedServings = useMemo(() => {
    const value = parseInt(servings, 10);
    return Number.isNaN(value) ? undefined : value;
  }, [servings]);

  const parsedIngredients = useMemo(
    () =>
      ingredientsInput
        .split(",")
        .map((ing) => ing.trim())
        .filter(Boolean),
    [ingredientsInput]
  );

  const handleGenerate = () => {
    if (!prompt.trim()) {
      Alert.alert("Prompt required", "Describe the recipe or goal you'd like Sous to tackle.");
      return;
    }

    generateRecipe.mutate({
      prompt: prompt.trim(),
      cuisine: cuisine.trim() || undefined,
      servings: parsedServings,
      ingredients: parsedIngredients.length ? parsedIngredients : undefined,
    });
  };

  const recipe = generateRecipe.data?.recipe;

  return (
    <AppLayout scrollable contentContainerStyle={styles.content}>
      <ScreenHeader
        title="AI Recipe Generator"
        subtitle="Describe what you want to cook and Sous will craft a recipe."
        actionLabel="Ask Sous"
        onActionPress={() => navigation.navigate("AIAssistant")}
        showSearch
        showBack
        onBackPress={() => navigation.goBack()}
      />

      <GlassCard style={styles.card}>
        <Text style={styles.label}>What should we make?</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          multiline
          placeholder="E.g. 'Cozy vegetarian dinner using mushrooms and kale'"
          value={prompt}
          onChangeText={setPrompt}
        />

        <Text style={styles.label}>Key ingredients (comma separated)</Text>
        <TextInput
          style={styles.input}
          placeholder="Mushrooms, kale, garlic"
          value={ingredientsInput}
          onChangeText={setIngredientsInput}
        />

        <View style={styles.row}>
          <View style={styles.half}>
            <Text style={styles.label}>Cuisine</Text>
            <TextInput
              style={styles.input}
              placeholder="Italian, Thai, etc."
              value={cuisine}
              onChangeText={setCuisine}
            />
          </View>
          <View style={styles.half}>
            <Text style={styles.label}>Servings</Text>
            <TextInput
              style={styles.input}
              placeholder="4"
              keyboardType="number-pad"
              value={servings}
              onChangeText={setServings}
            />
          </View>
        </View>

        <GradientButton
          title={generateRecipe.isPending ? "Generating..." : "Generate Recipe"}
          onPress={handleGenerate}
          disabled={generateRecipe.isPending}
          style={{ marginTop: spacing.md }}
        />
      </GlassCard>

      {generateRecipe.isPending && (
        <View style={styles.resultCard}>
          <LoadingSkeleton height={20} />
          <LoadingSkeleton height={20} width="80%" />
          <LoadingSkeleton height={100} />
        </View>
      )}

      {recipe && (
        <GlassCard style={styles.resultCard}>
          <Text style={styles.recipeTitle}>{recipe.name}</Text>
          <Text style={styles.recipeSubtitle}>{recipe.description}</Text>
          <View style={styles.metaRow}>
            {recipe.servings != null && recipe.servings > 0 ? (
              <Text style={styles.metaText}>Servings: {recipe.servings}</Text>
            ) : null}
            {recipe.cookingTime != null && recipe.cookingTime > 0 ? (
              <Text style={styles.metaText}>Time: {recipe.cookingTime} mins</Text>
            ) : null}
          </View>

          {recipe.tags?.length ? (
            <View style={styles.tagsRow}>
              {recipe.tags.map((tag: string) => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          ) : null}

          <Text style={styles.sectionTitle}>Ingredients</Text>
          {recipe.ingredients?.map((ing: any, idx: number) => (
            <Text key={`${ing.name}-${idx}`} style={styles.listItem}>
              • {ing.quantity ? `${ing.quantity} ` : ""}
              {ing.unit ? `${ing.unit} ` : ""}
              {ing.name}
            </Text>
          ))}

          <Text style={styles.sectionTitle}>Steps</Text>
          {recipe.steps?.map((step: string, idx: number) => (
            <Text key={`step-${idx}`} style={styles.listItem}>
              {idx + 1}. {step}
            </Text>
          ))}
        </GlassCard>
      )}
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
  },
  card: {
    marginBottom: spacing.lg,
  },
  label: {
    color: colors.text.secondary,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.glass.border,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    color: colors.text.primary,
  },
  multiline: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  row: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  half: {
    flex: 1,
  },
  resultCard: {
    marginBottom: spacing.lg,
  },
  recipeTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  recipeSubtitle: {
    color: colors.text.secondary,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  metaRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  metaText: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.sm,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  tag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    backgroundColor: colors.glass.background,
  },
  tagText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.primary,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  listItem: {
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
});

export default RecipeGeneratorScreen;

