import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import GlassCard from "../../components/GlassCard";
import LoadingSkeleton from "../../components/LoadingSkeleton";
import { colors, spacing, typography } from "../../styles/theme";
import { trpc } from "../../api/trpc";
import { getSearchHistory, addToSearchHistory, clearSearchHistory, type SearchHistoryItem } from "../../utils/searchHistory";

type Props = {
  visible: boolean;
  onClose: () => void;
};

const GlobalSearchOverlay: React.FC<Props> = ({ visible, onClose }) => {
  const navigation = useNavigation();
  const [query, setQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<SearchHistoryItem[]>([]);

  const { data: recipes, isLoading: recipesLoading } = trpc.recipes.list.useQuery(undefined, { enabled: visible });
  const { data: ingredients, isLoading: ingredientsLoading } = trpc.ingredients.getUserIngredients.useQuery(undefined, {
    enabled: visible,
  });
  // @ts-ignore - complex typing
  const { data: shoppingLists, isLoading: listsLoading } = trpc.shoppingLists.list.useQuery(undefined, {
    enabled: visible,
  });

  const lowerQuery = query.trim().toLowerCase();

  const filteredRecipes = useMemo(() => {
    if (!lowerQuery) return [];
    return (recipes || []).filter((recipe: any) =>
      recipe.name?.toLowerCase().includes(lowerQuery)
    );
  }, [recipes, lowerQuery]);

  const filteredIngredients = useMemo(() => {
    if (!lowerQuery) return [];
    return (ingredients || []).filter((item: any) =>
      item.name?.toLowerCase().includes(lowerQuery)
    );
  }, [ingredients, lowerQuery]);

  const filteredLists = useMemo(() => {
    if (!lowerQuery) return [];
    return (shoppingLists || []).filter((list: any) =>
      list.name?.toLowerCase().includes(lowerQuery)
    );
  }, [shoppingLists, lowerQuery]);

  const handleNavigate = async (type: "recipe" | "ingredient" | "list", id: number, name?: string) => {
    if (query.trim()) {
      await addToSearchHistory(query.trim(), type);
    }
    onClose();
    if (type === "recipe") {
      // @ts-ignore
      navigation.navigate("Recipes" as never, { screen: "RecipeDetail", params: { id } } as never);
    } else if (type === "ingredient") {
      navigation.navigate("Ingredients" as never);
    } else {
      navigation.navigate("ShoppingLists" as never, { screen: "ShoppingListDetail", params: { id } } as never);
    }
  };

  const handleRecentSearch = (item: SearchHistoryItem) => {
    setQuery(item.query);
  };

  useEffect(() => {
    if (visible) {
      getSearchHistory().then(setRecentSearches);
    }
  }, [visible]);

  const showEmpty =
    lowerQuery.length > 0 && !filteredRecipes.length && !filteredIngredients.length && !filteredLists.length;

  useEffect(() => {
    if (!visible) {
      setQuery("");
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      presentationStyle="overFullScreen"
      accessibilityViewIsModal
    >
      <View style={styles.backdrop}>
        <GlassCard style={styles.panel}>
          <View style={styles.searchRow}>
            <Ionicons name="search" size={18} color={colors.text.secondary} />
            <TextInput
              style={styles.input}
              placeholder="Search recipes, ingredients, lists"
              placeholderTextColor={colors.text.secondary}
              value={query}
              onChangeText={setQuery}
              autoFocus
              accessibilityLabel="Search across recipes, ingredients, and shopping lists"
            />
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={20} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>
          <Text style={styles.shortcutHint}>Press ⌘K / Ctrl+K anytime to open search.</Text>

          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.resultsContainer}>
            {!lowerQuery && recentSearches.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Recent Searches</Text>
                  <TouchableOpacity onPress={async () => {
                    await clearSearchHistory();
                    setRecentSearches([]);
                  }}>
                    <Text style={styles.clearText}>Clear</Text>
                  </TouchableOpacity>
                </View>
                {recentSearches.slice(0, 5).map((item, idx) => (
                  <TouchableOpacity
                    key={`recent-${idx}`}
                    style={styles.resultRow}
                    onPress={() => handleRecentSearch(item)}
                    accessibilityRole="button"
                    accessibilityLabel={`Search for ${item.query}`}
                  >
                    <Ionicons name="time-outline" size={18} color={colors.text.secondary} />
                    <Text style={styles.resultText}>{item.query}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {(recipesLoading || ingredientsLoading || listsLoading) && lowerQuery && (
              <View style={styles.loadingBlock}>
                <LoadingSkeleton height={16} />
                <LoadingSkeleton height={16} width="80%" />
              </View>
            )}

            {lowerQuery && filteredRecipes.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Recipes</Text>
                {filteredRecipes.slice(0, 5).map((recipe: any) => (
                  <TouchableOpacity
                    key={`recipe-${recipe.id}`}
                    style={styles.resultRow}
                    onPress={() => handleNavigate("recipe", recipe.id, recipe.name)}
                    accessibilityRole="button"
                    accessibilityLabel={`Open recipe ${recipe.name}`}
                  >
                    <Ionicons name="restaurant" size={18} color={colors.olive} />
                    <Text style={styles.resultText}>{recipe.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {lowerQuery && filteredIngredients.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Ingredients</Text>
                {filteredIngredients.slice(0, 5).map((item: any) => (
                  <TouchableOpacity
                    key={`ingredient-${item.id}`}
                    style={styles.resultRow}
                    onPress={() => handleNavigate("ingredient", item.id, item.name)}
                    accessibilityRole="button"
                    accessibilityLabel={`View ingredient ${item.name}`}
                  >
                    <Ionicons name="leaf" size={18} color={colors.russet} />
                    <Text style={styles.resultText}>{item.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {lowerQuery && filteredLists.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Shopping Lists</Text>
                {filteredLists.slice(0, 5).map((list: any) => (
                  <TouchableOpacity
                    key={`list-${list.id}`}
                    style={styles.resultRow}
                    onPress={() => handleNavigate("list", list.id, list.name)}
                    accessibilityRole="button"
                    accessibilityLabel={`Open shopping list ${list.name}`}
                  >
                    <Ionicons name="cart" size={18} color={colors.navy} />
                    <Text style={styles.resultText}>{list.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {lowerQuery && showEmpty ? <Text style={styles.emptyText}>No matches yet. Try another keyword.</Text> : null}
            {!lowerQuery && recentSearches.length === 0 && (
              <Text style={styles.emptyText}>Start typing to search recipes, ingredients, or shopping lists.</Text>
            )}
          </ScrollView>
        </GlassCard>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    padding: spacing.md,
  },
  panel: {
    maxHeight: "80%",
  },
  shortcutHint: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.sm,
    marginTop: spacing.sm,
    textAlign: "center",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderColor: colors.glass.border,
    marginBottom: spacing.sm,
  },
  input: {
    flex: 1,
    color: colors.text.primary,
  },
  resultsContainer: {
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  section: {
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.secondary,
    textTransform: "uppercase",
    fontSize: typography.fontSize.xs,
  },
  clearText: {
    color: colors.olive,
    fontSize: typography.fontSize.sm,
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  resultText: {
    color: colors.text.primary,
    fontSize: typography.fontSize.md,
  },
  emptyText: {
    textAlign: "center",
    color: colors.text.secondary,
  },
  loadingBlock: {
    gap: spacing.xs,
  },
});

export default GlobalSearchOverlay;

