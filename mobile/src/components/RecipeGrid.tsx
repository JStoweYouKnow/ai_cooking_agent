import React, { useCallback, useMemo, useRef } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import RecipeCard from "./RecipeCard";
import type { Recipe } from "../types";
import { trpc } from "../api/trpc";
import { resolveImageUrl, cacheImageAfterLoad } from "../utils/imageUrl";

interface RecipeGridProps {
  recipes: Recipe[];
  onSelect: (recipe: Recipe) => void;
  onToggleFavorite?: (recipeId: number) => void;
  onEndReached?: () => void;
  ListHeaderComponent?: React.ReactElement | null;
  ListEmptyComponent?: React.ReactElement | null;
  scrollEnabled?: boolean;
  numColumns?: number;
}

const CARD_HEIGHT = 320;
const CARD_OFFSET = 12;

const RecipeGrid: React.FC<RecipeGridProps> = ({
  recipes,
  onSelect,
  onToggleFavorite,
  onEndReached,
  ListHeaderComponent,
  ListEmptyComponent,
  scrollEnabled = true,
  numColumns = 1,
}) => {
  const keyExtractor = useCallback((item: Recipe) => item.id.toString(), []);

  const handleSelect = useCallback(
    (recipe: Recipe) => {
      onSelect(recipe);
    },
    [onSelect]
  );

  const renderItem = useCallback(
    ({ item }: { item: Recipe }) => (
      <View style={numColumns === 1 ? styles.cardWrapperSingle : styles.cardWrapper}>
        <RecipeCard recipe={item} onPress={() => handleSelect(item)} onToggleFavorite={onToggleFavorite} />
      </View>
    ),
    [handleSelect, onToggleFavorite, numColumns]
  );

  const memoizedHeader = useMemo(() => ListHeaderComponent || null, [ListHeaderComponent]);

  const utils = trpc.useUtils();
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 40 }).current;
  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: Array<{ item: Recipe }> }) => {
      for (const { item } of viewableItems) {
        if (!item?.id) continue;
        utils.recipes.getById.prefetch({ id: item.id }).catch(() => {});
        const imageUrl = resolveImageUrl(item.imageUrl);
        if (imageUrl) cacheImageAfterLoad(imageUrl);
      }
    },
    [utils]
  );

  const getItemLayout = useCallback(
    (_: any, index: number) => {
      if (numColumns === 1) {
        return {
          length: CARD_HEIGHT,
          offset: CARD_HEIGHT * index + CARD_OFFSET * index,
          index,
        };
      }
      return {
        length: CARD_HEIGHT,
        offset: CARD_HEIGHT * Math.floor(index / numColumns) + CARD_OFFSET * index,
        index,
      };
    },
    [numColumns]
  );

  return (
    <FlatList
      data={recipes}
      keyExtractor={keyExtractor}
      numColumns={numColumns}
      removeClippedSubviews
      initialNumToRender={numColumns === 1 ? 3 : 6}
      windowSize={5}
      maxToRenderPerBatch={10}
      getItemLayout={getItemLayout}
      columnWrapperStyle={numColumns > 1 ? styles.column : undefined}
      contentContainerStyle={styles.contentContainer}
      renderItem={renderItem}
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={viewabilityConfig}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      ListHeaderComponent={memoizedHeader}
      ListEmptyComponent={ListEmptyComponent}
      scrollEnabled={scrollEnabled}
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    paddingHorizontal: 12,
    paddingBottom: 40,
  },
  column: {
    justifyContent: 'space-between',
  },
  cardWrapper: {
    flex: 1,
    margin: 6,
  },
  cardWrapperSingle: {
    width: '100%',
    marginBottom: 12,
    marginHorizontal: 0,
  },
});

export default RecipeGrid;

