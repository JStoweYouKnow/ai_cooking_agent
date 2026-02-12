/**
 * Ingredient Substitution Panel Component
 * Shows substitution options for ingredients
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import GlassCard from "./GlassCard";
import GradientButton from "./GradientButton";
import { colors, spacing, typography, borderRadius } from "../styles/theme";
import { trpc } from "../api/trpc";
import { getSubstitutions, formatRatio, type Substitution } from "../utils/ingredientSubstitution";
import { mediumImpact } from "../utils/haptics";

interface IngredientSubstitutionPanelProps {
  ingredientName: string;
  onSelectSubstitution?: (substitution: Substitution) => void;
  dietaryPreferences?: string[];
  allergies?: string[];
}

const IngredientSubstitutionPanel: React.FC<IngredientSubstitutionPanelProps> = ({
  ingredientName,
  onSelectSubstitution,
  dietaryPreferences = [],
  allergies = [],
}) => {
  const [useAI, setUseAI] = useState(false);
  
  const aiSubstitutions = trpc.recipes.getSubstitutions.useQuery(
    {
      ingredientName,
      dietaryPreferences,
      allergies,
    },
    {
      enabled: useAI,
    }
  );

  // Get local substitutions first
  const localSubs = getSubstitutions(ingredientName, dietaryPreferences, allergies);

  const substitutions = useAI && aiSubstitutions.data 
    ? aiSubstitutions.data 
    : localSubs;

  const handleSelect = (sub: Substitution) => {
    mediumImpact();
    onSelectSubstitution?.(sub);
  };

  const handleLoadAI = () => {
    setUseAI(true);
  };

  if (substitutions.length === 0 && !useAI) {
    return (
      <GlassCard style={styles.card}>
        <Text style={styles.title}>No Substitutions Found</Text>
        <Text style={styles.subtitle}>
          Try AI-powered suggestions for more options
        </Text>
        <GradientButton
          title="Get AI Suggestions"
          onPress={handleLoadAI}
          style={styles.aiButton}
        />
      </GlassCard>
    );
  }

  return (
    <GlassCard style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Substitutions for {ingredientName}</Text>
          <Text style={styles.subtitle}>
            {substitutions.length} option{substitutions.length !== 1 ? "s" : ""} available
          </Text>
        </View>
        {!useAI && (
          <TouchableOpacity onPress={handleLoadAI} style={styles.aiBadge}>
            <Ionicons name="sparkles" size={16} color={colors.olive} />
            <Text style={styles.aiBadgeText}>AI</Text>
          </TouchableOpacity>
        )}
      </View>

      {aiSubstitutions.isLoading && (
        <View style={styles.loading}>
          <ActivityIndicator size="small" color={colors.olive} />
          <Text style={styles.loadingText}>Finding AI suggestions...</Text>
        </View>
      )}

      <ScrollView style={styles.substitutionsList}>
        {substitutions.map((sub, index) => (
          <TouchableOpacity
            key={index}
            style={styles.substitutionCard}
            onPress={() => handleSelect(sub)}
          >
            <View style={styles.substitutionHeader}>
              <Text style={styles.substitutionName}>{sub.name}</Text>
              <View style={styles.ratioBadge}>
                <Text style={styles.ratioText}>{formatRatio(sub.ratio)}</Text>
              </View>
            </View>
            <Text style={styles.substitutionReason}>{sub.reason}</Text>
            {sub.bestFor && (
              <View style={styles.bestFor}>
                <Ionicons name="star" size={12} color={colors.russet} />
                <Text style={styles.bestForText}>Best for: {sub.bestFor}</Text>
              </View>
            )}
            <View style={styles.selectButton}>
              <Ionicons name="arrow-forward-circle" size={20} color={colors.olive} />
              <Text style={styles.selectText}>Use this substitution</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Quick Actions */}
      {dietaryPreferences.length > 0 && (
        <View style={styles.quickActions}>
          <Text style={styles.quickActionsTitle}>Quick Actions</Text>
          <View style={styles.quickActionsRow}>
            {dietaryPreferences.includes("vegan") && (
              <TouchableOpacity style={styles.quickAction}>
                <Ionicons name="leaf" size={16} color={colors.olive} />
                <Text style={styles.quickActionText}>Make Vegan</Text>
              </TouchableOpacity>
            )}
            {dietaryPreferences.includes("gluten-free") && (
              <TouchableOpacity style={styles.quickAction}>
                <Ionicons name="shield-checkmark" size={16} color={colors.olive} />
                <Text style={styles.quickActionText}>Make GF</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  aiBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.olive + "20",
    borderRadius: borderRadius.full,
  },
  aiBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.olive,
  },
  loading: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
  },
  loadingText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  substitutionsList: {
    maxHeight: 400,
  },
  substitutionCard: {
    backgroundColor: colors.glass.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  substitutionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  substitutionName: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    flex: 1,
  },
  ratioBadge: {
    backgroundColor: colors.olive + "20",
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  ratioText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.olive,
  },
  substitutionReason: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  bestFor: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  bestForText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    fontStyle: "italic",
  },
  selectButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  selectText: {
    fontSize: typography.fontSize.sm,
    color: colors.olive,
    fontWeight: typography.fontWeight.medium,
  },
  quickActions: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  quickActionsTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  quickActionsRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  quickAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.olive + "10",
    borderRadius: borderRadius.md,
  },
  quickActionText: {
    fontSize: typography.fontSize.sm,
    color: colors.olive,
    fontWeight: typography.fontWeight.medium,
  },
});

export default IngredientSubstitutionPanel;
