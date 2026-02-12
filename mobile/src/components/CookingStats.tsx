/**
 * CookingStats Component
 * Displays cooking achievements, streak, and statistics
 */

import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import GlassCard from "./GlassCard";
import { colors, spacing, typography, borderRadius, gradients } from "../styles/theme";
import { trpc } from "../api/trpc";

interface CookingStatsProps {
  style?: any;
}

const CookingStats: React.FC<CookingStatsProps> = ({ style }) => {
  const { data: stats } = trpc.recipes.getStats.useQuery();
  const { data: recentlyCooked } = trpc.recipes.getRecentlyCooked.useQuery({ limit: 10 });

  // Calculate cooking streak (consecutive days with cooked recipes)
  const cookingStreak = useMemo(() => {
    if (!recentlyCooked || recentlyCooked.length === 0) return 0;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let streak = 0;
    let checkDate = new Date(today);
    
    // Sort by cookedAt descending
    const sortedRecipes = [...recentlyCooked]
      .filter((r: any) => r.cookedAt)
      .sort((a: any, b: any) => new Date(b.cookedAt).getTime() - new Date(a.cookedAt).getTime());
    
    if (sortedRecipes.length === 0) return 0;
    
    // Check each day backwards
    for (let i = 0; i < 30; i++) { // Check last 30 days max
      const dayStart = new Date(checkDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(checkDate);
      dayEnd.setHours(23, 59, 59, 999);
      
      const cookedOnDay = sortedRecipes.some((r: any) => {
        const cookedDate = new Date(r.cookedAt);
        return cookedDate >= dayStart && cookedDate <= dayEnd;
      });
      
      if (cookedOnDay) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (i === 0) {
        // Today hasn't been cooked yet, check yesterday
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break; // Streak broken
      }
    }
    
    return streak;
  }, [recentlyCooked]);

  // Total recipes cooked (sum of cookedCount)
  const totalCooked = useMemo(() => {
    if (!recentlyCooked) return 0;
    return recentlyCooked.reduce((sum: number, r: any) => sum + (r.cookedCount || 0), 0);
  }, [recentlyCooked]);

  // Get streak message
  const getStreakMessage = () => {
    if (cookingStreak === 0) return "Start cooking today!";
    if (cookingStreak === 1) return "1 day streak - keep it up!";
    if (cookingStreak < 7) return `${cookingStreak} day streak!`;
    if (cookingStreak < 30) return `${cookingStreak} day streak! 🔥`;
    return `${cookingStreak} day streak! 🏆`;
  };

  // Get achievement badge
  const getAchievementBadge = () => {
    if (totalCooked >= 100) return { icon: "trophy", label: "Master Chef", color: "#FFD700" };
    if (totalCooked >= 50) return { icon: "medal", label: "Expert Cook", color: "#C0C0C0" };
    if (totalCooked >= 25) return { icon: "ribbon", label: "Home Chef", color: "#CD7F32" };
    if (totalCooked >= 10) return { icon: "star", label: "Rising Star", color: colors.olive };
    if (totalCooked >= 1) return { icon: "flame", label: "Getting Started", color: colors.russet };
    return null;
  };

  const achievement = getAchievementBadge();

  return (
    <GlassCard style={[styles.container, style]}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Cooking Journey</Text>
        {achievement && (
          <View style={[styles.badge, { backgroundColor: achievement.color }]}>
            <Ionicons name={achievement.icon as any} size={14} color={colors.text.inverse} />
            <Text style={styles.badgeText}>{achievement.label}</Text>
          </View>
        )}
      </View>

      <View style={styles.statsRow}>
        {/* Streak Card */}
        <LinearGradient
          colors={cookingStreak > 0 ? [colors.olive, colors.russet] : ["#ccc", "#999"]}
          style={styles.statCard}
        >
          <Ionicons 
            name={cookingStreak > 0 ? "flame" : "flame-outline"} 
            size={32} 
            color={colors.text.inverse} 
          />
          <Text style={styles.statNumber}>{cookingStreak}</Text>
          <Text style={styles.statLabel}>Day Streak</Text>
        </LinearGradient>

        {/* Total Cooked Card */}
        <View style={styles.statCard}>
          <Ionicons name="restaurant" size={32} color={colors.olive} />
          <Text style={[styles.statNumber, { color: colors.text.primary }]}>{totalCooked}</Text>
          <Text style={[styles.statLabel, { color: colors.text.secondary }]}>Recipes Cooked</Text>
        </View>

        {/* Saved Recipes Card */}
        <View style={styles.statCard}>
          <Ionicons name="bookmark" size={32} color={colors.russet} />
          <Text style={[styles.statNumber, { color: colors.text.primary }]}>{stats?.recipeCount || 0}</Text>
          <Text style={[styles.statLabel, { color: colors.text.secondary }]}>Saved</Text>
        </View>
      </View>

      <Text style={styles.message}>{getStreakMessage()}</Text>
    </GlassCard>
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
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  badgeText: {
    color: colors.text.inverse,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
  statsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.glass.background,
  },
  statNumber: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.inverse,
    marginTop: spacing.xs,
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.inverse,
    opacity: 0.9,
  },
  message: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    textAlign: "center",
  },
});

export default CookingStats;
