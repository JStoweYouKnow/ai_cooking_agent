import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  TextInput,
  Alert,
  Image,
  Linking,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { RecipeStackScreenProps } from "../../navigation/types";
import { trpc } from "../../api/trpc";
import GlassCard from "../../components/GlassCard";
import SearchBar from "../../components/SearchBar";
import GradientButton from "../../components/GradientButton";
import Badge from "../../components/Badge";
import LoadingSkeleton from "../../components/LoadingSkeleton";
import EmptyState from "../../components/EmptyState";
import BottomSheet from "../../components/BottomSheet";
import RecipeGrid from "../../components/RecipeGrid";
import { colors, spacing, typography, borderRadius } from "../../styles/theme";

type Props = RecipeStackScreenProps<"RecipeList">;
type SourceOption = "TheMealDB" | "Epicurious" | "Delish" | "NYTCooking";

interface ExternalRecipe {
  id: string;
  title: string;
  imageUrl?: string | null;
  source: SourceOption | string;
  externalId?: string;
  url?: string;
}

const SOURCE_OPTIONS: SourceOption[] = ["TheMealDB", "Epicurious", "Delish", "NYTCooking"];

const RecipeListScreen: React.FC<Props> = ({ navigation }) => {
  const utils = trpc.useUtils();
  const [searchIngredients, setSearchIngredients] = useState<string[]>([]);
  const [currentIngredient, setCurrentIngredient] = useState("");
  const [selectedSources, setSelectedSources] = useState<SourceOption[]>(["TheMealDB"]);
  const [searchResults, setSearchResults] = useState<ExternalRecipe[]>([]);
  const [visibleCount, setVisibleCount] = useState(12);
  const [hasSearched, setHasSearched] = useState(false);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [urlSheetVisible, setUrlSheetVisible] = useState(false);
  const [importUrl, setImportUrl] = useState("");
  const [urlError, setUrlError] = useState<string>("");
  const [savingRecipeId, setSavingRecipeId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"recent" | "alphabetical" | "meal">("recent");
  const [mealFilter, setMealFilter] = useState<"breakfast" | "lunch" | "dinner" | "dessert" | null>(null);
  const [sortSheetVisible, setSortSheetVisible] = useState(false);

  // Ensure we stay on RecipeList when the screen is focused
  // This prevents auto-navigation to RecipeDetail
  useFocusEffect(
    React.useCallback(() => {
      // Reset any navigation state that might have been preserved
      // This ensures we always show RecipeList when the Recipes tab is focused
      return () => {
        // Cleanup if needed
      };
    }, [])
  );

  const { data: savedRecipes, isLoading: savedRecipesLoading } = trpc.recipes.list.useQuery({
    sortBy,
    mealFilter: mealFilter || undefined,
  });
  const { data: userIngredients } = trpc.ingredients.getUserIngredients.useQuery();
  const { data: allIngredients } = trpc.ingredients.list.useQuery();

  const searchMutation = trpc.recipes.searchByIngredients.useMutation();
  const parseFromUrlMutation = trpc.recipes.parseFromUrl.useMutation({
    onSuccess: (res: any) => {
      utils.recipes.list.invalidate();
      if ('id' in res && res.id) {
        // Recipe was auto-saved - navigate to it so user can see ingredients
        Alert.alert('Success', 'Recipe imported successfully!', [
          {
            text: 'View Recipe',
            onPress: () => navigation.navigate('RecipeDetail', { recipeId: res.id })
          }
        ]);
      }
    },
  });
  const importFromTheMealDBMutation = trpc.recipes.importFromTheMealDB.useMutation({
    onSuccess: () => utils.recipes.list.invalidate(),
  });

  const pantryIngredientNames = useMemo(() => {
    if (!userIngredients || !allIngredients) return [];
    const ingredientMap = new Map(allIngredients.map((ing: any) => [ing.id, ing.name]));
    return userIngredients
      .map((item: any) => ingredientMap.get(item.ingredientId))
      .filter((name): name is string => Boolean(name));
  }, [userIngredients, allIngredients]);

  const displayedResults = searchResults.slice(0, visibleCount);
  const isSearching = searchMutation.isPending;

  const handleAddIngredient = () => {
    const trimmed = currentIngredient.trim();
    if (!trimmed) {
      Alert.alert("Add Ingredient", "Please enter an ingredient name.");
      return;
    }
    if (searchIngredients.length >= 5) {
      Alert.alert("Limit Reached", "You can add up to 5 ingredients.");
      return;
    }
    if (searchIngredients.includes(trimmed.toLowerCase())) {
      Alert.alert("Duplicate", "This ingredient is already in your list.");
      return;
    }
    setSearchIngredients((prev) => [...prev, trimmed.toLowerCase()]);
    setCurrentIngredient("");
  };

  const handleRemoveIngredient = (ingredient: string) => {
    setSearchIngredients((prev) => prev.filter((ing) => ing !== ingredient));
  };

  const handleUseMyPantry = () => {
    if (!pantryIngredientNames.length) {
      Alert.alert("Pantry Empty", "Add ingredients to your pantry before using this shortcut.");
      return;
    }
    setSearchIngredients(pantryIngredientNames.slice(0, 5).map((name) => name.toLowerCase()));
  };

  const normalizeResults = (results: any[]): ExternalRecipe[] =>
    (results || []).map((item, index) => {
      const title = item.strMeal || item.title || item.name || "Untitled Recipe";
      const imageUrl = item.strMealThumb || item.imageUrl || item.thumbnail || null;
      const externalId = item.idMeal || item.id || `${item.source || "external"}-${index}`;
      return {
        id: String(externalId),
        title,
        imageUrl,
        source: (item.source || "TheMealDB") as SourceOption,
        externalId: item.idMeal ? String(item.idMeal) : item.id ? String(item.id) : undefined,
        url: item.url || item.sourceUrl || undefined,
      };
    });

  const handleSearch = async () => {
    if (searchIngredients.length === 0) {
      Alert.alert("Add Ingredients", "Add at least one ingredient to search.");
      return;
    }
    if (selectedSources.length === 0) {
      Alert.alert("Select Sources", "Choose at least one recipe source.");
      return;
    }

    setHasSearched(true);
    setVisibleCount(12);

    try {
      const data = await searchMutation.mutateAsync({
        ingredients: searchIngredients,
        sources: selectedSources,
      });
      setSearchResults(normalizeResults(data));
    } catch (error: any) {
      Alert.alert("Search Failed", error?.message || "Unable to search recipes right now.");
    }
  };

  const handleLoadMoreResults = () => {
    if (visibleCount < searchResults.length) {
      setVisibleCount((prev) => prev + 10);
    }
  };

  const handleToggleSource = (source: SourceOption) => {
    setSelectedSources((prev) =>
      prev.includes(source) ? prev.filter((item) => item !== source) : [...prev, source]
    );
  };

  const handleSaveRecipe = async (recipe: ExternalRecipe) => {
    if (savingRecipeId) return;
    setSavingRecipeId(recipe.id);
    try {
      if (recipe.source === "TheMealDB" && recipe.externalId) {
        await importFromTheMealDBMutation.mutateAsync({ mealId: recipe.externalId });
        Alert.alert("Success", "Recipe saved to your collection.");
      } else if (recipe.url) {
        await parseFromUrlMutation.mutateAsync({ url: recipe.url, autoSave: true });
        Alert.alert("Imported", "Recipe imported and saved.");
      } else {
        Alert.alert("Not Supported", "This source can't be imported automatically yet.");
      }
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to save recipe.");
    } finally {
      setSavingRecipeId(null);
    }
  };

  const validateUrl = (url: string) => {
    try {
      new URL(url.trim());
      return true;
    } catch {
      return false;
    }
  };

  const handleImportFromUrl = async () => {
    if (!importUrl.trim()) {
      setUrlError("Please enter a recipe URL");
      return;
    }
    if (!validateUrl(importUrl)) {
      setUrlError("Enter a valid URL");
      return;
    }
    setUrlError("");
    try {
      await parseFromUrlMutation.mutateAsync({ url: importUrl.trim(), autoSave: true });
      Alert.alert("Imported", "Recipe imported successfully.");
      setImportUrl("");
      setUrlSheetVisible(false);
    } catch (error: any) {
      Alert.alert("Import Failed", error?.message || "Unable to import this recipe.");
    }
  };

  const openAIAssistant = () => {
    navigation.getParent()?.navigate("Settings" as never, { screen: "AIAssistant" } as never);
  };

  const openRecipeGenerator = () => {
    navigation.getParent()?.navigate("Settings" as never, { screen: "RecipeGenerator" } as never);
  };

  const renderIngredientChips = () => (
    <View style={styles.chipsContainer}>
      {searchIngredients.map((ingredient) => (
        <View key={ingredient} style={styles.chip}>
          <Text style={styles.chipText}>{ingredient}</Text>
          <TouchableOpacity onPress={() => handleRemoveIngredient(ingredient)}>
            <Text style={styles.removeChip}>×</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );

  const renderResultCard = (recipe: ExternalRecipe) => (
    <View key={recipe.id} style={styles.resultCard}>
      {recipe.imageUrl ? (
        <Image source={{ uri: recipe.imageUrl }} style={styles.resultImage} />
      ) : (
        <View style={styles.resultPlaceholder}>
          <Ionicons name="restaurant" size={32} color={colors.olive} />
        </View>
      )}
      <View style={styles.resultMeta}>
        <Text style={styles.resultTitle} numberOfLines={2}>
          {recipe.title}
        </Text>
        <Badge label={recipe.source} variant="cuisine" />
      </View>
      {recipe.url && (
        <TouchableOpacity onPress={() => Linking.openURL(recipe.url!)}>
          <Text style={styles.resultLink}>Open source</Text>
        </TouchableOpacity>
      )}
      <GradientButton
        title={savingRecipeId === recipe.id ? "Saving..." : "Save to Collection"}
        onPress={() => handleSaveRecipe(recipe)}
        disabled={savingRecipeId === recipe.id}
        style={styles.saveButton}
      />
    </View>
  );

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Recipe Discovery</Text>
        <Text style={styles.subtitle}>
          Combine pantry ingredients, explore premium sources, or import recipes by URL.
        </Text>

        <GlassCard style={[styles.card, styles.aiCard]}>
          <Text style={styles.sectionTitle}>Need inspiration?</Text>
          <Text style={styles.aiBody}>
            Use Sous AI to brainstorm dishes or instantly generate a recipe tailored to the ingredients you have on
            hand.
          </Text>
          <View style={styles.aiActions}>
            <GradientButton title="Generate Recipe" onPress={openRecipeGenerator} style={styles.flexButton} />
            <GradientButton
              title="Ask Sous"
              variant="secondary"
              onPress={openAIAssistant}
              style={styles.flexButton}
            />
          </View>
        </GlassCard>

        <GlassCard style={styles.card}>
          <SearchBar
            value={currentIngredient}
            onChangeText={setCurrentIngredient}
            placeholder="Add an ingredient (max 5)"
            showFiltersButton
            onFiltersPress={() => setFiltersVisible(true)}
            onSubmitEditing={handleAddIngredient}
          />
          <View style={styles.quickRow}>
            <GradientButton title="Add Ingredient" onPress={handleAddIngredient} style={styles.flexButton} />
            <GradientButton
              title="Use My Pantry"
              onPress={handleUseMyPantry}
              variant="secondary"
              style={styles.flexButton}
            />
          </View>
          {searchIngredients.length > 0 && renderIngredientChips()}
          <GradientButton
            title={isSearching ? "Searching..." : "Search Recipes"}
            onPress={handleSearch}
            disabled={isSearching}
            style={styles.searchButton}
          />
        </GlassCard>

        <GlassCard style={styles.card}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <Pressable
              style={({ pressed }) => [styles.quickActionItem, pressed && styles.quickActionItemPressed]}
              onPress={() => setUrlSheetVisible(true)}
              accessibilityRole="button"
              accessibilityLabel="Import recipe from URL"
            >
              <Ionicons name="link" size={22} color={colors.olive} />
              <Text style={styles.quickActionText}>Import from URL</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.quickActionItem, pressed && styles.quickActionItemPressed]}
              onPress={() => navigation.navigate("CreateRecipe")}
              accessibilityRole="button"
              accessibilityLabel="Create recipe manually"
            >
              <Ionicons name="create" size={22} color={colors.russet} />
              <Text style={styles.quickActionText}>Create Recipe</Text>
            </Pressable>
          </View>
        </GlassCard>

        <View style={styles.sourcesWrapper}>
          <Text style={styles.sectionTitle}>Sources</Text>
          <View style={styles.sourcesRow}>
            {SOURCE_OPTIONS.map((source) => (
              <TouchableOpacity
                key={source}
                style={[
                  styles.sourceChip,
                  selectedSources.includes(source) && styles.sourceChipSelected,
                ]}
                onPress={() => handleToggleSource(source)}
              >
                <Text
                  style={[
                    styles.sourceChipText,
                    selectedSources.includes(source) && styles.sourceChipTextSelected,
                  ]}
                >
                  {source}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.resultsSection}>
          <Text style={styles.sectionTitle}>Search Results</Text>
          {isSearching && (
            <View style={styles.skeletonGrid}>
              {Array.from({ length: 4 }).map((_, idx) => (
                <GlassCard key={idx} style={styles.resultSkeleton}>
                  <LoadingSkeleton width="100%" height={150} borderRadiusOverride={borderRadius.lg} />
                  <LoadingSkeleton width="80%" height={16} />
                  <LoadingSkeleton width="40%" height={14} />
                </GlassCard>
              ))}
            </View>
          )}
          {!isSearching && hasSearched && searchResults.length === 0 && (
            <EmptyState
              title="No recipes found"
              description="Try adding different ingredients or include more sources."
              primaryActionLabel="Adjust Filters"
              onPrimaryAction={() => setFiltersVisible(true)}
            />
          )}
          {!isSearching && searchResults.length > 0 && (
            <View>
              <Text style={styles.resultsMeta}>
                Showing {displayedResults.length} of {searchResults.length} recipes
              </Text>
              <View style={styles.resultsGrid}>
                {displayedResults.map((recipe) => renderResultCard(recipe))}
              </View>
              {visibleCount < searchResults.length && (
                <GradientButton title="Load more results" onPress={handleLoadMoreResults} style={styles.loadMore} />
              )}
            </View>
          )}
        </View>

        <View style={styles.savedSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Recipes</Text>
            <TouchableOpacity
              onPress={() => setSortSheetVisible(true)}
              style={styles.sortButton}
            >
              <Ionicons name="options-outline" size={20} color={colors.olive} />
              <Text style={styles.sortButtonText}>Sort</Text>
            </TouchableOpacity>
          </View>
          {mealFilter && (
            <View style={styles.filterChip}>
              <Text style={styles.filterChipText}>
                Filter: {mealFilter.charAt(0).toUpperCase() + mealFilter.slice(1)}
              </Text>
              <TouchableOpacity onPress={() => setMealFilter(null)}>
                <Ionicons name="close-circle" size={18} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>
          )}
          {savedRecipesLoading ? (
            <View style={styles.skeletonGrid}>
              {Array.from({ length: 4 }).map((_, idx) => (
                <LoadingSkeleton key={`saved-${idx}`} width="100%" height={120} borderRadiusOverride={borderRadius.lg} />
              ))}
            </View>
          ) : savedRecipes && savedRecipes.length > 0 ? (
            <RecipeGrid
              recipes={savedRecipes}
              onSelect={(recipe) => navigation.navigate("RecipeDetail", { id: recipe.id })}
              scrollEnabled={false}
            />
          ) : (
            <EmptyState
              title="No saved recipes yet"
              description="Import or create recipes to build your collection."
              primaryActionLabel="Create Recipe"
              onPrimaryAction={() => navigation.navigate("CreateRecipe")}
            />
          )}
        </View>
      </ScrollView>

      <BottomSheet visible={filtersVisible} onClose={() => setFiltersVisible(false)} snapHeight={0.4}>
        <Text style={styles.sheetTitle}>Recipe Sources</Text>
        <View style={styles.sheetSources}>
          {SOURCE_OPTIONS.map((source) => (
            <TouchableOpacity
              key={`sheet-${source}`}
              style={[
                styles.sourceChip,
                selectedSources.includes(source) && styles.sourceChipSelected,
              ]}
              onPress={() => handleToggleSource(source)}
            >
              <Text
                style={[
                  styles.sourceChipText,
                  selectedSources.includes(source) && styles.sourceChipTextSelected,
                ]}
              >
                {source}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <GradientButton title="Done" onPress={() => setFiltersVisible(false)} />
      </BottomSheet>

      <BottomSheet visible={sortSheetVisible} onClose={() => setSortSheetVisible(false)} snapHeight={0.6}>
        <Text style={styles.sheetTitle}>Sort & Filter Recipes</Text>
        
        <View style={styles.sortSection}>
          <Text style={styles.sortSectionTitle}>Sort By</Text>
          <TouchableOpacity
            style={[styles.sortOption, sortBy === "recent" && styles.sortOptionSelected]}
            onPress={() => setSortBy("recent")}
          >
            <Ionicons
              name={sortBy === "recent" ? "radio-button-on" : "radio-button-off"}
              size={20}
              color={sortBy === "recent" ? colors.olive : colors.text.secondary}
            />
            <Text style={[styles.sortOptionText, sortBy === "recent" && styles.sortOptionTextSelected]}>
              Most Recent
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortOption, sortBy === "alphabetical" && styles.sortOptionSelected]}
            onPress={() => setSortBy("alphabetical")}
          >
            <Ionicons
              name={sortBy === "alphabetical" ? "radio-button-on" : "radio-button-off"}
              size={20}
              color={sortBy === "alphabetical" ? colors.olive : colors.text.secondary}
            />
            <Text style={[styles.sortOptionText, sortBy === "alphabetical" && styles.sortOptionTextSelected]}>
              Alphabetically (A-Z)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortOption, sortBy === "meal" && styles.sortOptionSelected]}
            onPress={() => setSortBy("meal")}
          >
            <Ionicons
              name={sortBy === "meal" ? "radio-button-on" : "radio-button-off"}
              size={20}
              color={sortBy === "meal" ? colors.olive : colors.text.secondary}
            />
            <Text style={[styles.sortOptionText, sortBy === "meal" && styles.sortOptionTextSelected]}>
              By Meal Type
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sortSection}>
          <Text style={styles.sortSectionTitle}>Filter by Meal</Text>
          <View style={styles.mealFilterRow}>
            {(["breakfast", "lunch", "dinner", "dessert"] as const).map((meal) => (
              <TouchableOpacity
                key={meal}
                style={[
                  styles.mealFilterChip,
                  mealFilter === meal && styles.mealFilterChipSelected,
                ]}
                onPress={() => setMealFilter(mealFilter === meal ? null : meal)}
              >
                <Text
                  style={[
                    styles.mealFilterChipText,
                    mealFilter === meal && styles.mealFilterChipTextSelected,
                  ]}
                >
                  {meal.charAt(0).toUpperCase() + meal.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <GradientButton title="Apply" onPress={() => setSortSheetVisible(false)} />
      </BottomSheet>

      <BottomSheet visible={urlSheetVisible} onClose={() => setUrlSheetVisible(false)} snapHeight={0.65}>
        <Text style={styles.sheetTitle}>Import Recipe from URL</Text>
        <TextInput
          value={importUrl}
          onChangeText={(text) => {
            setImportUrl(text);
            if (urlError) setUrlError("");
          }}
          placeholder="https://example.com/recipe"
          style={[styles.urlInput, urlError && styles.urlInputError]}
          autoCapitalize="none"
          keyboardType="url"
        />
        {urlError ? <Text style={styles.errorText}>{urlError}</Text> : null}
        <GradientButton
          title={parseFromUrlMutation.isPending ? "Importing..." : "Import Recipe"}
          onPress={handleImportFromUrl}
          disabled={parseFromUrlMutation.isPending}
        />
      </BottomSheet>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  title: {
    fontSize: typography.fontSize.xxxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.navy,
  },
  subtitle: {
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  card: {
    marginBottom: spacing.lg,
  },
  aiCard: {
    gap: spacing.sm,
  },
  aiBody: {
    color: colors.text.secondary,
  },
  aiActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  quickRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  flexButton: {
    flex: 1,
  },
  searchButton: {
    marginTop: spacing.md,
  },
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.glass.background,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.glass.border,
  },
  chipText: {
    color: colors.text.primary,
    marginRight: spacing.xs,
  },
  removeChip: {
    color: colors.error,
    fontSize: typography.fontSize.lg,
  },
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.md,
  },
  quickActionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  quickActionItemPressed: {
    transform: [{ scale: 0.97 }],
  },
  quickActionText: {
    color: colors.text.primary,
    fontWeight: typography.fontWeight.medium,
  },
  sourcesWrapper: {
    marginBottom: spacing.lg,
  },
  sourcesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  sourceChip: {
    borderWidth: 1,
    borderColor: colors.glass.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  sourceChipSelected: {
    backgroundColor: colors.olive,
    borderColor: colors.olive,
  },
  sourceChipText: {
    color: colors.text.primary,
    fontWeight: typography.fontWeight.medium,
  },
  sourceChipTextSelected: {
    color: colors.text.inverse,
  },
  sectionTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.navy,
  },
  resultsSection: {
    marginBottom: spacing.xl,
  },
  resultsMeta: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  resultsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  resultCard: {
    width: "48%",
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    ...{
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
  },
  resultImage: {
    width: "100%",
    height: 150,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  resultPlaceholder: {
    width: "100%",
    height: 150,
    borderRadius: borderRadius.md,
    backgroundColor: colors.glass.background,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  resultMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  resultTitle: {
    flex: 1,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    marginRight: spacing.xs,
    color: colors.text.primary,
  },
  resultLink: {
    fontSize: typography.fontSize.sm,
    color: colors.olive,
    marginBottom: spacing.sm,
  },
  saveButton: {
    marginTop: spacing.xs,
  },
  skeletonGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  resultSkeleton: {
    width: "48%",
  },
  loadMore: {
    marginTop: spacing.md,
  },
  savedSection: {
    marginBottom: spacing.xl,
  },
  sheetTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.md,
    color: colors.text.primary,
  },
  sheetSources: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  urlInput: {
    borderWidth: 1,
    borderColor: colors.glass.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    color: colors.text.primary,
  },
  urlInputError: {
    borderColor: colors.error,
  },
  errorText: {
    color: colors.error,
    marginBottom: spacing.sm,
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.glass.border,
  },
  sortButtonText: {
    fontSize: typography.fontSize.sm,
    color: colors.olive,
    fontWeight: typography.fontWeight.medium,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.olive + "20",
    borderRadius: borderRadius.full,
    alignSelf: "flex-start",
    marginBottom: spacing.md,
  },
  filterChipText: {
    fontSize: typography.fontSize.sm,
    color: colors.olive,
    fontWeight: typography.fontWeight.medium,
  },
  sortSection: {
    marginBottom: spacing.lg,
  },
  sortSectionTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.navy,
    marginBottom: spacing.md,
  },
  sortOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
  },
  sortOptionSelected: {
    backgroundColor: colors.olive + "10",
  },
  sortOptionText: {
    fontSize: typography.fontSize.md,
    color: colors.text.primary,
  },
  sortOptionTextSelected: {
    color: colors.olive,
    fontWeight: typography.fontWeight.semibold,
  },
  mealFilterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  mealFilterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.glass.border,
  },
  mealFilterChipSelected: {
    backgroundColor: colors.olive,
    borderColor: colors.olive,
  },
  mealFilterChipText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.medium,
  },
  mealFilterChipTextSelected: {
    color: colors.text.inverse,
  },
});

export default RecipeListScreen;
