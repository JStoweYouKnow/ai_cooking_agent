import React, { memo, useMemo, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import type { Recipe } from "../types";
import Card from "./Card";
import { resolveImageUrl } from "../utils/imageUrl";

interface RecipeCardProps {
  recipe: Recipe;
  onPress: () => void;
  onToggleFavorite?: (id: number) => void;
}

const RecipeCardComponent: React.FC<RecipeCardProps> = ({ recipe, onPress, onToggleFavorite }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const isFavorite = useMemo(() => {
    const favValue = recipe.isFavorite;
    return Boolean(
      favValue === true ||
        (typeof favValue === "string" && favValue === "true") ||
        (typeof favValue === "number" && favValue === 1)
    );
  }, [recipe.isFavorite]);

  // Resolve image URL (handles relative URLs by resolving against API base URL)
  const imageUri = useMemo(() => {
    const resolved = resolveImageUrl(recipe.imageUrl);
    if (!resolved) {
      console.log("[RecipeCard] No imageUrl for recipe:", recipe.name, recipe.id);
      return null;
    }
    console.log("[RecipeCard] Resolved imageUrl for recipe:", recipe.name, "Original:", recipe.imageUrl, "Resolved:", resolved);
    return resolved;
  }, [recipe.imageUrl, recipe.name, recipe.id]);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`View recipe ${recipe.name}`}
      accessibilityHint="Opens full recipe details"
    >
      <Card>
        <View style={styles.container}>
          {imageUri && !imageError ? (
            <Image
              source={{ uri: imageUri }}
              style={styles.image}
              contentFit="cover"
              transition={200}
              onLoad={() => {
                setImageLoading(false);
                console.log("[RecipeCard] Image loaded successfully:", imageUri);
              }}
              onError={(error) => {
                console.error("[RecipeCard] Image load error:", error, "URL:", imageUri);
                setImageError(true);
                setImageLoading(false);
              }}
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="restaurant" size={32} color="#999" />
            </View>
          )}
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title} numberOfLines={2}>
                {recipe.name}
              </Text>
              {onToggleFavorite ? (
                <TouchableOpacity
                  onPress={() => onToggleFavorite(recipe.id)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons
                    name={isFavorite ? "heart" : "heart-outline"}
                    size={24}
                    color={isFavorite ? "#ff4444" : "#999"}
                  />
                </TouchableOpacity>
              ) : null}
            </View>
            {recipe.description ? (
              <Text style={styles.description} numberOfLines={2}>
                {recipe.description}
              </Text>
            ) : null}
            <View style={styles.footer}>
              {recipe.cuisine ? (
                <View style={styles.tag}>
                  <Text style={styles.tagText}>{recipe.cuisine}</Text>
                </View>
              ) : null}
              {recipe.cookingTime != null && recipe.cookingTime > 0 ? (
                <View style={styles.timeContainer}>
                  <Ionicons name="time-outline" size={16} color="#666" />
                  <Text style={styles.timeText}>{recipe.cookingTime} min</Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "column",
  },
  image: {
    width: "100%",
    height: 180,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: "#f5f5f5",
  },
  imagePlaceholder: {
    width: "100%",
    height: 180,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginRight: 8,
    lineHeight: 24,
  },
  description: {
    fontSize: 14,
    color: "#666",
    marginBottom: 10,
    lineHeight: 20,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  tag: {
    backgroundColor: "#6B8E23",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 4,
  },
});

const RecipeCard = memo(RecipeCardComponent);

export default RecipeCard;
