import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, Platform, Switch } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme, ThemeMode } from "../../contexts/ThemeContext";
import GlassCard from "../../components/GlassCard";
import GradientButton from "../../components/GradientButton";
import LoadingSkeleton from "../../components/LoadingSkeleton";
import { colors, spacing, typography, borderRadius } from "../../styles/theme";
import { trpc } from "../../api/trpc";
import { MoreStackScreenProps } from "../../navigation/types";
import AppLayout from "../../components/layout/AppLayout";
import ScreenHeader from "../../components/layout/ScreenHeader";
import LegalLinks from "../../components/LegalLinks";

const DIETARY_PRESETS = ["Vegetarian", "Vegan", "Pescatarian", "Keto", "Paleo", "Mediterranean", "Low Carb", "High Protein"];
const ALLERGY_PRESETS = ["Gluten", "Dairy", "Peanuts", "Tree Nuts", "Soy", "Eggs", "Shellfish", "Sesame"];
const GOAL_PRESETS = [
  { id: "balance", label: "Balanced Diet" },
  { id: "muscle", label: "Build Muscle" },
  { id: "weight_loss", label: "Weight Loss" },
  { id: "energy", label: "Boost Energy" },
];

type Props = MoreStackScreenProps<"SettingsMain">;

const SettingsScreen: React.FC<Props> = ({ navigation }) => {
  const { user, logout } = useAuth();
  const { mode, isDark, setTheme } = useTheme();
  // @ts-ignore - tRPC types are complex, runtime works correctly
  const utils = trpc.useUtils();
  const { data: preferences, isLoading } = trpc.user.getPreferences.useQuery();
  const { data: pushDevices, refetch: refetchPushDevices } = trpc.notifications.listDevices.useQuery();
  const updatePreferences = trpc.user.updatePreferences.useMutation({
    onSuccess: () => {
      utils.user.getPreferences.invalidate();
      Alert.alert("Saved", "Preferences updated");
    },
  });
  const registerDevice = trpc.notifications.registerDevice.useMutation({
    onSuccess: () => {
      refetchPushDevices();
      Alert.alert("Enabled", "Push notifications are now active for this device.");
    },
    onError: (error) => Alert.alert("Unable to enable push", error.message),
  });
  const unregisterDevice = trpc.notifications.unregisterDevice.useMutation({
    onSuccess: () => {
      refetchPushDevices();
      Alert.alert("Disabled", "This device will no longer receive push notifications.");
    },
    onError: (error) => Alert.alert("Unable to disable push", error.message),
  });
  const sendTestPush = trpc.notifications.sendTestPush.useMutation({
    onSuccess: () => Alert.alert("Sent", "Check your device for a Sous notification."),
    onError: (error) => Alert.alert("Unable to send test", error.message),
  });

  const [dietary, setDietary] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [customDietary, setCustomDietary] = useState("");
  const [customAllergy, setCustomAllergy] = useState("");
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [calorieBudget, setCalorieBudget] = useState("");

  useEffect(() => {
    if (preferences) {
      setDietary(preferences.dietaryPreferences || []);
      setAllergies(preferences.allergies || []);
      setSelectedGoal((preferences.goals as any)?.goal ?? null);
      setCalorieBudget(preferences.calorieBudget ? String(preferences.calorieBudget) : "");
    }
  }, [preferences]);

  const toggleDietary = (preset: string) => {
    setDietary((prev) =>
      prev.includes(preset) ? prev.filter((item) => item !== preset) : [...prev, preset]
    );
  };

  const toggleAllergy = (preset: string) => {
    setAllergies((prev) =>
      prev.includes(preset) ? prev.filter((item) => item !== preset) : [...prev, preset]
    );
  };

  const addCustomValue = (value: string, setter: (list: string[]) => void, current: string[], reset: () => void) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    if (!current.includes(trimmed)) {
      setter([...current, trimmed]);
    }
    reset();
  };

  const canSave = useMemo(() => !updatePreferences.isPending, [updatePreferences.isPending]);

  const handleSave = () => {
    updatePreferences.mutate({
      dietaryPreferences: dietary,
      allergies,
      goals: selectedGoal ? { goal: selectedGoal } : null,
      calorieBudget: calorieBudget ? Number(calorieBudget) : null,
    });
  };

  const hasPushDevice = (pushDevices?.length ?? 0) > 0;
  const primaryPushToken = pushDevices?.[0]?.token;

  const requestExpoPushToken = async () => {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      throw new Error("Permission not granted");
    }

    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId ?? Constants?.expoConfig?.projectId;
    if (!projectId) {
      throw new Error("Project ID missing in app config.");
    }

    const tokenResult = await Notifications.getExpoPushTokenAsync({ projectId });
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
      });
    }
    return tokenResult.data;
  };

  const handleEnablePush = async () => {
    try {
      const token = await requestExpoPushToken();
      const platform = Platform.OS === "ios" ? "ios" : Platform.OS === "android" ? "android" : "web";
      registerDevice.mutate({ token, platform });
    } catch (error: any) {
      Alert.alert("Permission needed", error?.message || "Enable notifications from system settings.");
    }
  };

  const handleDisablePush = (token: string) => {
    unregisterDevice.mutate({ token });
  };

  const handleSendTestPush = () => {
    sendTestPush.mutate();
  };

  return (
    <AppLayout scrollable contentContainerStyle={{ paddingBottom: spacing.xxl }}>
      <ScreenHeader
        title="Settings"
        subtitle="Personalize your culinary experience."
        actionLabel="Messages"
        onActionPress={() => navigation.navigate("MessagesList")}
        showSearch
      />

      <View style={styles.quickLinks}>
        <TouchableOpacity
          style={styles.quickLink}
          onPress={() => navigation.navigate("MessagesList")}
          accessibilityRole="button"
          accessibilityLabel="Open messages"
        >
          <Ionicons name="chatbubble-ellipses" size={18} color={colors.olive} />
          <Text style={styles.quickLinkText}>Messages</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickLink}
          onPress={() => navigation.navigate("Notifications")}
          accessibilityRole="button"
          accessibilityLabel="View notifications"
        >
          <Ionicons name="notifications" size={18} color={colors.russet} />
          <Text style={styles.quickLinkText}>Notifications</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickLink}
          onPress={() => navigation.navigate("AIAssistant")}
          accessibilityRole="button"
          accessibilityLabel="Chat with Sous AI"
        >
          <Ionicons name="sparkles" size={18} color={colors.navy} />
          <Text style={styles.quickLinkText}>Sous AI</Text>
        </TouchableOpacity>
      </View>

      <GlassCard style={styles.card}>
        <Text style={styles.sectionTitle}>Account</Text>
        {user ? (
          <>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{user.email || "Not set"}</Text>
            <Text style={styles.label}>Role</Text>
            <Text style={styles.value}>{user.role}</Text>
          </>
        ) : (
          <LoadingSkeleton height={16} width="60%" />
        )}
        <GradientButton title="Sign Out" variant="secondary" onPress={logout} style={{ marginTop: spacing.md }} />
      </GlassCard>

      <GlassCard style={styles.card}>
        <Text style={styles.sectionTitle}>Subscription</Text>
        <Text style={styles.label}>Manage your subscription and unlock premium features</Text>
        <GradientButton
          title="View Plans"
          onPress={() => navigation.navigate("Subscription")}
          style={{ marginTop: spacing.sm }}
        />
      </GlassCard>

      <GlassCard style={styles.card}>
        <Text style={styles.sectionTitle}>Meal Planning</Text>
        <Text style={styles.label}>AI-powered weekly meal plans tailored to your schedule</Text>
        <GradientButton
          title="Open Meal Planner"
          onPress={() => navigation.navigate("MealPlanning")}
          style={{ marginTop: spacing.sm }}
        />
      </GlassCard>

      <GlassCard style={styles.card}>
        <Text style={styles.sectionTitle}>Appearance</Text>
        <Text style={styles.label}>Theme</Text>
        <View style={styles.themeOptions}>
          {(['light', 'dark', 'system'] as ThemeMode[]).map((themeMode) => {
            const isSelected = mode === themeMode;
            const icon = themeMode === 'light' ? 'sunny' : themeMode === 'dark' ? 'moon' : 'phone-portrait';
            const label = themeMode.charAt(0).toUpperCase() + themeMode.slice(1);
            return (
              <TouchableOpacity
                key={themeMode}
                style={[styles.themeOption, isSelected && styles.themeOptionSelected]}
                onPress={() => setTheme(themeMode)}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={`${label} theme`}
              >
                <Ionicons
                  name={icon as any}
                  size={20}
                  color={isSelected ? colors.text.inverse : colors.text.primary}
                />
                <Text style={[styles.themeOptionText, isSelected && styles.themeOptionTextSelected]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <Text style={styles.themeHint}>
          {mode === 'system' 
            ? `Currently: ${isDark ? 'Dark' : 'Light'} (following system)`
            : `${isDark ? 'Dark' : 'Light'} mode active`}
        </Text>
      </GlassCard>

      <GlassCard style={styles.card}>
        <Text style={styles.sectionTitle}>Push Notifications</Text>
        <Text style={styles.label}>
          {hasPushDevice
            ? "Enabled on this device. We'll send reminders, AI tips, and shopping updates."
            : "Enable notifications to stay on top of new recipes, shopping reminders, and AI insights."}
        </Text>
        {hasPushDevice ? (
          <View style={styles.row}>
            <GradientButton
              title={sendTestPush.isPending ? "Sending..." : "Send Test"}
              onPress={handleSendTestPush}
              disabled={sendTestPush.isPending}
              style={[styles.halfButton, { flex: 1 }]}
            />
            <GradientButton
              title={unregisterDevice.isPending ? "Disabling..." : "Disable"}
              variant="secondary"
              onPress={() => primaryPushToken && handleDisablePush(primaryPushToken)}
              disabled={unregisterDevice.isPending}
              style={[styles.halfButton, { flex: 1 }]}
            />
          </View>
        ) : (
          <GradientButton
            title={registerDevice.isPending ? "Enabling..." : "Enable Push Notifications"}
            onPress={handleEnablePush}
            disabled={registerDevice.isPending}
            style={{ marginTop: spacing.sm }}
          />
        )}
      </GlassCard>

      <GlassCard style={styles.card}>
        <Text style={styles.sectionTitle}>Dietary Preferences</Text>
        {isLoading ? (
          <LoadingSkeleton height={16} width="80%" />
        ) : (
          <View style={styles.chipsContainer}>
            {DIETARY_PRESETS.map((preset) => {
              const selected = dietary.includes(preset);
              return (
                <TouchableOpacity
                  key={preset}
                  style={[styles.chip, selected && styles.chipSelected]}
                  onPress={() => toggleDietary(preset)}
                >
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{preset}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
        <View style={styles.row}>
          <TextInput
            placeholder="Add custom preference"
            value={customDietary}
            onChangeText={setCustomDietary}
            style={[styles.input, { flex: 1 }]}
          />
          <GradientButton
            title="Add"
            onPress={() =>
              addCustomValue(customDietary, setDietary, dietary, () => setCustomDietary(""))
            }
            style={styles.addButton}
          />
        </View>
      </GlassCard>

      <GlassCard style={styles.card}>
        <Text style={styles.sectionTitle}>Allergies</Text>
        {isLoading ? (
          <LoadingSkeleton height={16} width="70%" />
        ) : (
          <View style={styles.chipsContainer}>
            {ALLERGY_PRESETS.map((preset) => {
              const selected = allergies.includes(preset);
              return (
                <TouchableOpacity
                  key={preset}
                  style={[styles.chip, selected && styles.chipSelected]}
                  onPress={() => toggleAllergy(preset)}
                >
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{preset}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
        <View style={styles.row}>
          <TextInput
            placeholder="Add custom allergy"
            value={customAllergy}
            onChangeText={setCustomAllergy}
            style={[styles.input, { flex: 1 }]}
          />
          <GradientButton
            title="Add"
            onPress={() =>
              addCustomValue(customAllergy, setAllergies, allergies, () => setCustomAllergy(""))
            }
            style={styles.addButton}
          />
        </View>
      </GlassCard>

      <GlassCard style={styles.card}>
        <Text style={styles.sectionTitle}>Goals & Wellness</Text>
        <View style={styles.goalRow}>
          {GOAL_PRESETS.map((goal) => {
            const selected = selectedGoal === goal.id;
            return (
              <TouchableOpacity
                key={goal.id}
                style={[styles.goalChip, selected && styles.goalChipSelected]}
                onPress={() => setSelectedGoal(selected ? null : goal.id)}
              >
                <Text style={[styles.goalChipText, selected && styles.goalChipTextSelected]}>{goal.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <Text style={styles.label}>Calorie Budget</Text>
        <TextInput
          placeholder="e.g., 2000"
          keyboardType="number-pad"
          value={calorieBudget}
          onChangeText={setCalorieBudget}
          style={styles.input}
        />
      </GlassCard>

      <GradientButton
        title={updatePreferences.isPending ? "Saving..." : "Save Preferences"}
        onPress={handleSave}
        disabled={!canSave}
        style={{ marginBottom: spacing.lg }}
      />

      <GlassCard style={styles.card}>
        <Text style={styles.sectionTitle}>Component Library</Text>
        <TouchableOpacity
          style={styles.quickLink}
          onPress={() => navigation.navigate("ButtonShowcase")}
          accessibilityRole="button"
          accessibilityLabel="Open Button Showcase"
        >
          <Ionicons name="square-outline" size={18} color={colors.olive} />
          <Text style={styles.quickLinkText}>Button Showcase</Text>
        </TouchableOpacity>
      </GlassCard>

      <View style={{ marginHorizontal: spacing.md }}>
        <LegalLinks showHeader showSupport />
      </View>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  quickLinks: {
    flexDirection: "row",
    gap: spacing.sm,
    marginHorizontal: spacing.md,
    marginBottom: spacing.lg,
    flexWrap: "wrap",
  },
  quickLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.glass.background,
  },
  quickLinkText: {
    color: colors.text.primary,
    fontWeight: typography.fontWeight.medium,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.navy,
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: spacing.sm,
  },
  value: {
    fontSize: typography.fontSize.md,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.medium,
  },
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginVertical: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.glass.border,
  },
  chipSelected: {
    backgroundColor: colors.olive,
    borderColor: colors.olive,
  },
  chipText: {
    color: colors.text.primary,
  },
  chipTextSelected: {
    color: colors.text.inverse,
  },
  row: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
    alignItems: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: colors.glass.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    color: colors.text.primary,
  },
  addButton: {
    marginLeft: spacing.sm,
  },
  halfButton: {
    flex: 1,
  },
  goalRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginVertical: spacing.sm,
  },
  goalChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.glass.border,
  },
  goalChipSelected: {
    backgroundColor: colors.russet,
    borderColor: colors.russet,
  },
  goalChipText: {
    color: colors.text.primary,
  },
  goalChipTextSelected: {
    color: colors.text.inverse,
  },
  themeOptions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginVertical: spacing.sm,
  },
  themeOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.glass.border,
    backgroundColor: colors.glass.background,
  },
  themeOptionSelected: {
    backgroundColor: colors.olive,
    borderColor: colors.olive,
  },
  themeOptionText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
  },
  themeOptionTextSelected: {
    color: colors.text.inverse,
  },
  themeHint: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
    fontStyle: "italic",
  },
});

export default SettingsScreen;
