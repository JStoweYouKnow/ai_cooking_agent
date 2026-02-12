import React, { useCallback } from "react";
import {
  FlatList,
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Badge from "./Badge";
import GradientButton from "./GradientButton";
import { colors, spacing, typography, borderRadius } from "../styles/theme";

interface ExternalRecipe {
  id: string;
  title: string;
  imageUrl?: string | null;
  source: string;
  externalId?: string;
  url?: string;
}

interface SearchResultsGridProps {
  results: ExternalRecipe[];
  onSaveRecipe: (recipe: ExternalRecipe) => void;
  savingRecipeId: string | null;
  scrollEnabled?: boolean;
}

const ITEM_HEIGHT = 280; // Approximate height of result card

const SearchResultsGrid: React.FC<SearchResultsGridProps> = ({
  results,
  onSaveRecipe,
  savingRecipeId,
  scrollEnabled = false,
}) => {
  const keyExtractor = useCallback((item: ExternalRecipe) => item.id, []);

  const renderItem = useCallback(
    ({ item }: { item: ExternalRecipe }) => (
      <View
        style={styles.resultCard}
        accessible={true}
        accessibilityLabel={`Recipe: ${item.title} from ${item.source}`}
      >
        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.resultImage}
            accessibilityRole="image"
            accessibilityLabel={`Photo of ${item.title}`}
          />
        ) : (
          <View
            style={styles.resultPlaceholder}
            accessibilityRole="image"
            accessibilityLabel="No image available"
          >
            <Ionicons name="restaurant" size={32} color={colors.olive} />
          </View>
        )}
        <View style={styles.resultMeta}>
          <Text style={styles.resultTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Badge label={item.source} variant="cuisine" />
        </View>
        {item.url && (
          <TouchableOpacity
            onPress={() => Linking.openURL(item.url!)}
            accessibilityRole="link"
            accessibilityLabel={`Open ${item.title} source website`}
            accessibilityHint="Opens in browser"
          >
            <Text style={styles.resultLink}>Open source</Text>
          </TouchableOpacity>
        )}
        <GradientButton
          title={savingRecipeId === item.id ? "Saving..." : "Save to Collection"}
          onPress={() => onSaveRecipe(item)}
          disabled={savingRecipeId === item.id}
          style={styles.saveButton}
        />
      </View>
    ),
    [savingRecipeId, onSaveRecipe]
  );

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * Math.floor(index / 2),
      index,
    }),
    []
  );

  return (
    <FlatList
      data={results}
      keyExtractor={keyExtractor}
      numColumns={2}
      renderItem={renderItem}
      scrollEnabled={scrollEnabled}
      removeClippedSubviews
      initialNumToRender={6}
      maxToRenderPerBatch={10}
      windowSize={5}
      getItemLayout={getItemLayout}
      columnWrapperStyle={styles.columnWrapper}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    gap: spacing.sm,
  },
  columnWrapper: {
    justifyContent: "space-between",
  },
  resultCard: {
    width: "48%",
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
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
});

export default SearchResultsGrid;
