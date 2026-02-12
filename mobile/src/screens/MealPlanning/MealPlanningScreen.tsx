/**
 * Meal Planning Screen
 * AI-powered weekly meal planning with calendar integration
 */

import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import GlassCard from "../../components/GlassCard";
import GradientButton from "../../components/GradientButton";
import LoadingSkeleton from "../../components/LoadingSkeleton";
import EmptyState from "../../components/EmptyState";
import { colors, spacing, typography, borderRadius, shadows, gradients } from "../../styles/theme";
import { trpc } from "../../api/trpc";
import { useSubscription } from "../../hooks/useSubscription";
import AppLayout from "../../components/layout/AppLayout";
import ScreenHeader from "../../components/layout/ScreenHeader";
import { MoreStackScreenProps } from "../../navigation/types";
import { mediumImpact, successNotification } from "../../utils/haptics";

type Props = MoreStackScreenProps<"MealPlanning">;

interface MealPlanDay {
  date: string;
  dayName: string;
  breakfast?: { id: number; name: string };
  lunch?: { id: number; name: string };
  dinner?: { id: number; name: string };
  snack?: { id: number; name: string };
}

const MealPlanningScreen: React.FC<Props> = ({ navigation }) => {
  const utils = trpc.useUtils();
  const { isPremium } = useSubscription();
  const { data: preferences } = trpc.user.getPreferences.useQuery();
  const { data: recipesList, isLoading: recipesLoading, isError: recipesError, refetch: refetchRecipes } = trpc.recipes.list.useQuery({ limit: 50 });
  
  const [selectedWeek, setSelectedWeek] = useState(0); // 0 = current week
  const [isGenerating, setIsGenerating] = useState(false);
  const [mealPlan, setMealPlan] = useState<MealPlanDay[] | null>(null);

  const generateMealPlanMutation = trpc.recipes.generateMealPlan.useMutation({
    onError: (error) => {
      Alert.alert("Error", error.message || "Failed to generate meal plan");
    },
  });

  // Get current week dates
  const weekDates = useMemo(() => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
    
    const days: MealPlanDay[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i + selectedWeek * 7);
      days.push({
        date: date.toISOString().split("T")[0],
        dayName: date.toLocaleDateString("en-US", { weekday: "short" }),
      });
    }
    return days;
  }, [selectedWeek]);

  const handleGeneratePlan = async () => {
    if (!isPremium) {
      Alert.alert(
        "Premium Feature",
        "Meal planning is a premium feature. Upgrade to unlock AI-powered meal planning!"
      );
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateMealPlanMutation.mutateAsync({
        weekStart: weekDates[0]?.date,
        maxCookingTime: preferences?.maxCookingTime ?? undefined,
      });
      const days = (result as { days?: Array<{ date: string; breakfast?: { id?: number; name?: string }; lunch?: { id?: number; name?: string }; dinner?: { id?: number; name?: string }; snack?: { id?: number; name?: string } }> }).days ?? [];
      const mapped: MealPlanDay[] = days.map((d) => {
        const dateObj = new Date(d.date);
        const dayName = dateObj.toLocaleDateString("en-US", { weekday: "short" });
        return {
          date: d.date,
          dayName,
          breakfast: d.breakfast?.id && d.breakfast?.name ? { id: d.breakfast.id, name: d.breakfast.name } : undefined,
          lunch: d.lunch?.id && d.lunch?.name ? { id: d.lunch.id, name: d.lunch.name } : undefined,
          dinner: d.dinner?.id && d.dinner?.name ? { id: d.dinner.id, name: d.dinner.name } : undefined,
          snack: d.snack?.id && d.snack?.name ? { id: d.snack.id, name: d.snack.name } : undefined,
        };
      });
      setMealPlan(mapped.length > 0 ? mapped : null);
      await utils.recipes.list.invalidate();
      successNotification();
      Alert.alert(
        "Meal Plan Generated",
        "Your AI-generated weekly meal plan is ready. New recipes have been added to your collection."
      );
    } catch {
      // onError already shows alert
    } finally {
      setIsGenerating(false);
    }
  };

  const renderMealSlot = (meal: { id: number; name: string } | undefined, type: string) => {
    if (!meal) {
      return (
        <TouchableOpacity style={styles.emptyMealSlot}>
          <Ionicons name="add-circle-outline" size={20} color={colors.text.tertiary} />
          <Text style={styles.emptyMealText}>Add {type}</Text>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        style={styles.mealSlot}
        onPress={() => navigation.navigate("RecipeDetail" as never, { id: meal.id } as never)}
      >
        <Text style={styles.mealName} numberOfLines={2}>
          {meal.name}
        </Text>
        <Ionicons name="chevron-forward" size={16} color={colors.text.secondary} />
      </TouchableOpacity>
    );
  };

  return (
    <AppLayout scrollable contentContainerStyle={{ paddingBottom: spacing.xxl }}>
      <ScreenHeader
        title="Meal Planning"
        subtitle="AI-powered weekly meal plans tailored to your schedule"
        onBackPress={() => navigation.goBack()}
      />

      {/* Premium Badge */}
      {!isPremium && (
        <GlassCard style={styles.premiumCard}>
          <View style={styles.premiumHeader}>
            <Ionicons name="star" size={24} color={colors.russet} />
            <Text style={styles.premiumTitle}>Premium Feature</Text>
          </View>
          <Text style={styles.premiumText}>
            Unlock AI-powered meal planning that adapts to your calendar, preferences, and budget.
          </Text>
          <GradientButton
            title="Upgrade to Premium"
            onPress={() => navigation.navigate("Subscription" as never)}
            style={styles.upgradeButton}
          />
        </GlassCard>
      )}

      {/* Recipes load error */}
      {isPremium && recipesError && (
        <EmptyState
          variant="error"
          title="Couldn't load recipes"
          description="We need your recipes to build a plan."
          primaryActionLabel="Retry"
          onPrimaryAction={() => refetchRecipes()}
        />
      )}

      {/* Generate Plan Button */}
      {isPremium && !recipesError && (
        <GlassCard style={styles.generateCard}>
          <View style={styles.generateHeader}>
            <Ionicons name="sparkles" size={24} color={colors.olive} />
            <View style={styles.generateText}>
              <Text style={styles.generateTitle}>Generate Weekly Plan</Text>
              <Text style={styles.generateSubtitle}>
                AI will create a personalized meal plan based on your preferences
              </Text>
            </View>
          </View>
          <GradientButton
            title={isGenerating ? "Generating..." : "Generate Meal Plan"}
            onPress={handleGeneratePlan}
            disabled={isGenerating}
            style={styles.generateButton}
          />
        </GlassCard>
      )}

      {/* Week Selector */}
      <View style={styles.weekSelector}>
        <TouchableOpacity
          onPress={() => setSelectedWeek(selectedWeek - 1)}
          style={styles.weekNavButton}
        >
          <Ionicons name="chevron-back" size={24} color={colors.olive} />
        </TouchableOpacity>
        <Text style={styles.weekLabel}>
          Week of {weekDates[0].date}
        </Text>
        <TouchableOpacity
          onPress={() => setSelectedWeek(selectedWeek + 1)}
          style={styles.weekNavButton}
        >
          <Ionicons name="chevron-forward" size={24} color={colors.olive} />
        </TouchableOpacity>
      </View>

      {/* Meal Plan Calendar */}
      {isPremium ? (
        <View style={styles.calendar}>
          {(mealPlan || weekDates).map((day, index) => (
            <GlassCard key={index} style={styles.dayCard}>
              <View style={styles.dayHeader}>
                <Text style={styles.dayName}>{day.dayName}</Text>
                <Text style={styles.dayDate}>
                  {new Date(day.date).getDate()}
                </Text>
              </View>
              <View style={styles.mealsContainer}>
                {renderMealSlot(day.breakfast, "Breakfast")}
                {renderMealSlot(day.lunch, "Lunch")}
                {renderMealSlot(day.dinner, "Dinner")}
                {renderMealSlot(day.snack, "Snack")}
              </View>
            </GlassCard>
          ))}
        </View>
      ) : (
        <GlassCard style={styles.placeholderCard}>
          <Ionicons name="calendar-outline" size={64} color={colors.text.tertiary} />
          <Text style={styles.placeholderText}>
            Upgrade to Premium to unlock AI-powered meal planning
          </Text>
        </GlassCard>
      )}

      {/* Shopping List Generation */}
      {isPremium && (
        <GlassCard style={styles.shoppingCard}>
          <View style={styles.shoppingHeader}>
            <Ionicons name="cart" size={24} color={colors.olive} />
            <Text style={styles.shoppingTitle}>Weekly Shopping List</Text>
          </View>
          <Text style={styles.shoppingText}>
            Generate a shopping list for all meals in this week's plan
          </Text>
          <GradientButton
            title="Generate Shopping List"
            variant="secondary"
            onPress={() => {
              // Navigate to shopping list with week's ingredients
              navigation.navigate("ShoppingLists" as never);
            }}
            style={styles.shoppingButton}
          />
        </GlassCard>
      )}
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  premiumCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.lg,
    padding: spacing.lg,
  },
  premiumHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  premiumTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  premiumText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    lineHeight: typography.lineHeight.relaxed * typography.fontSize.sm,
    marginBottom: spacing.md,
  },
  upgradeButton: {
    marginTop: spacing.sm,
  },
  generateCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.lg,
    padding: spacing.lg,
  },
  generateHeader: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  generateText: {
    flex: 1,
  },
  generateTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  generateSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  generateButton: {
    marginTop: spacing.sm,
  },
  weekSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  weekNavButton: {
    padding: spacing.sm,
  },
  weekLabel: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  calendar: {
    gap: spacing.md,
    marginHorizontal: spacing.md,
  },
  dayCard: {
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  dayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dayName: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  dayDate: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  mealsContainer: {
    gap: spacing.sm,
  },
  mealSlot: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.glass.background,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  mealName: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.medium,
  },
  emptyMealSlot: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.divider,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
  },
  emptyMealText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
  },
  placeholderCard: {
    marginHorizontal: spacing.md,
    padding: spacing.xxl,
    alignItems: "center",
  },
  placeholderText: {
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
    textAlign: "center",
    marginTop: spacing.md,
  },
  shoppingCard: {
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
    padding: spacing.lg,
  },
  shoppingHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  shoppingTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  shoppingText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  shoppingButton: {
    marginTop: spacing.sm,
  },
});

export default MealPlanningScreen;
