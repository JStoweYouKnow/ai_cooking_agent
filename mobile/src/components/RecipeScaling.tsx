/**
 * Recipe Scaling Component
 * Adjust servings and see scaled ingredient quantities
 */

import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import GlassCard from "./GlassCard";
import GradientButton from "./GradientButton";
import { colors, spacing, typography, borderRadius, shadows, gradients } from "../styles/theme";
import {
  scaleIngredients,
  formatServings,
  getServingSizeOptions,
  ScaledIngredient,
} from "../utils/recipeScaling";
import { lightImpact, selectionFeedback } from "../utils/haptics";

interface RecipeScalingProps {
  originalServings: number;
  ingredients: string[];
  onServingsChange?: (newServings: number, scaledIngredients: ScaledIngredient[]) => void;
}

const RecipeScaling: React.FC<RecipeScalingProps> = ({
  originalServings,
  ingredients,
  onServingsChange,
}) => {
  const [targetServings, setTargetServings] = useState(originalServings);
  const [showModal, setShowModal] = useState(false);

  const servingOptions = useMemo(
    () => getServingSizeOptions(originalServings),
    [originalServings]
  );

  const scaledIngredients = useMemo(
    () => scaleIngredients(ingredients, originalServings, targetServings),
    [ingredients, originalServings, targetServings]
  );

  const multiplier = useMemo(() => {
    if (originalServings <= 0) return 1;
    return targetServings / originalServings;
  }, [originalServings, targetServings]);

  const handleServingChange = async (value: number) => {
    await selectionFeedback();
    setTargetServings(value);
    const newScaled = scaleIngredients(ingredients, originalServings, value);
    onServingsChange?.(value, newScaled);
  };

  const handleQuickSelect = async (serving: number) => {
    await lightImpact();
    setTargetServings(serving);
    const newScaled = scaleIngredients(ingredients, originalServings, serving);
    onServingsChange?.(serving, newScaled);
  };

  const getMultiplierDisplay = () => {
    if (multiplier === 1) return null;
    if (multiplier === 0.5) return "½×";
    if (multiplier === 2) return "2×";
    if (multiplier === 3) return "3×";
    if (multiplier === 4) return "4×";
    return `${multiplier.toFixed(1)}×`;
  };

  return (
    <>
      <GlassCard style={styles.container}>
        <TouchableOpacity
          style={styles.header}
          onPress={() => setShowModal(true)}
        >
          <View style={styles.headerLeft}>
            <Ionicons name="resize-outline" size={20} color={colors.olive} />
            <Text style={styles.title}>Servings</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.servingCount}>
              {formatServings(targetServings)}
            </Text>
            {multiplier !== 1 && (
              <View style={styles.multiplierBadge}>
                <Text style={styles.multiplierText}>
                  {getMultiplierDisplay()}
                </Text>
              </View>
            )}
            <Ionicons
              name="chevron-forward"
              size={16}
              color={colors.text.tertiary}
            />
          </View>
        </TouchableOpacity>

        {/* Quick Select Buttons */}
        <View style={styles.quickButtons}>
          {servingOptions.slice(0, 5).map((serving) => (
            <TouchableOpacity
              key={serving}
              style={[
                styles.quickButton,
                targetServings === serving && styles.quickButtonActive,
              ]}
              onPress={() => handleQuickSelect(serving)}
            >
              <Text
                style={[
                  styles.quickButtonText,
                  targetServings === serving && styles.quickButtonTextActive,
                ]}
              >
                {serving}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </GlassCard>

      {/* Full Scaling Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Adjust Servings</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            {/* Serving Slider */}
            <View style={styles.sliderSection}>
              <Text style={styles.sliderLabel}>
                <Text style={styles.servingsHighlight}>{targetServings}</Text>
                {" servings"}
                {multiplier !== 1 && (
                  <Text style={styles.multiplierInline}>
                    {" "}({getMultiplierDisplay()} recipe)
                  </Text>
                )}
              </Text>
              <Slider
                style={styles.slider}
                minimumValue={1}
                maximumValue={20}
                step={1}
                value={targetServings}
                onValueChange={handleServingChange}
                minimumTrackTintColor={colors.olive}
                maximumTrackTintColor={colors.divider}
                thumbTintColor={colors.olive}
              />
              <View style={styles.sliderLabels}>
                <Text style={styles.sliderEndLabel}>1</Text>
                <Text style={styles.sliderEndLabel}>20</Text>
              </View>
            </View>

            {/* Preset Options */}
            <Text style={styles.sectionTitle}>Quick Options</Text>
            <View style={styles.presetGrid}>
              <TouchableOpacity
                style={styles.presetButton}
                onPress={() => handleQuickSelect(Math.ceil(originalServings / 2))}
              >
                <Text style={styles.presetEmoji}>½</Text>
                <Text style={styles.presetLabel}>Half</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.presetButton}
                onPress={() => handleQuickSelect(originalServings)}
              >
                <Text style={styles.presetEmoji}>1×</Text>
                <Text style={styles.presetLabel}>Original</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.presetButton}
                onPress={() => handleQuickSelect(originalServings * 2)}
              >
                <Text style={styles.presetEmoji}>2×</Text>
                <Text style={styles.presetLabel}>Double</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.presetButton}
                onPress={() => handleQuickSelect(originalServings * 3)}
              >
                <Text style={styles.presetEmoji}>3×</Text>
                <Text style={styles.presetLabel}>Triple</Text>
              </TouchableOpacity>
            </View>

            {/* Scaled Ingredients Preview */}
            <Text style={styles.sectionTitle}>Scaled Ingredients</Text>
            <ScrollView style={styles.ingredientsList}>
              {scaledIngredients.map((item, index) => (
                <View key={index} style={styles.ingredientRow}>
                  <View style={styles.ingredientBullet} />
                  <Text style={styles.ingredientText}>
                    {item.scaled}
                  </Text>
                  {item.originalQuantity !== null &&
                    item.originalQuantity !== item.quantity && (
                      <Text style={styles.originalAmount}>
                        (was: {item.original})
                      </Text>
                    )}
                </View>
              ))}
            </ScrollView>

            <GradientButton
              title="Apply"
              onPress={() => setShowModal(false)}
              style={styles.applyButton}
            />
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  title: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  servingCount: {
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
  },
  multiplierBadge: {
    backgroundColor: colors.olive,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  multiplierText: {
    color: colors.text.inverse,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  quickButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  quickButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: "center",
    backgroundColor: colors.divider,
    borderRadius: borderRadius.md,
  },
  quickButtonActive: {
    backgroundColor: colors.olive,
  },
  quickButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.secondary,
  },
  quickButtonTextActive: {
    color: colors.text.inverse,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  sliderSection: {
    marginBottom: spacing.lg,
  },
  sliderLabel: {
    fontSize: typography.fontSize.lg,
    color: colors.text.secondary,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  servingsHighlight: {
    fontSize: typography.fontSize.xxxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.olive,
  },
  multiplierInline: {
    fontSize: typography.fontSize.md,
    color: colors.text.tertiary,
  },
  slider: {
    width: "100%",
    height: 40,
  },
  sliderLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xs,
  },
  sliderEndLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
  },
  sectionTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  presetGrid: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  presetButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.md,
    backgroundColor: colors.divider,
    borderRadius: borderRadius.md,
  },
  presetEmoji: {
    fontSize: typography.fontSize.xl,
    marginBottom: spacing.xs,
  },
  presetLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
  },
  ingredientsList: {
    maxHeight: 200,
    marginBottom: spacing.md,
  },
  ingredientRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: spacing.xs,
    flexWrap: "wrap",
  },
  ingredientBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.olive,
    marginTop: 6,
    marginRight: spacing.sm,
  },
  ingredientText: {
    fontSize: typography.fontSize.md,
    color: colors.text.primary,
    flex: 1,
  },
  originalAmount: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    fontStyle: "italic",
    marginLeft: spacing.sm,
  },
  applyButton: {
    marginTop: spacing.sm,
  },
});

export default RecipeScaling;
