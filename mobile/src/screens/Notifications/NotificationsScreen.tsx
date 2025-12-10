import React, { useMemo } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { trpc } from "../../api/trpc";
import AppLayout from "../../components/layout/AppLayout";
import ScreenHeader from "../../components/layout/ScreenHeader";
import GlassCard from "../../components/GlassCard";
import LoadingSkeleton from "../../components/LoadingSkeleton";
import EmptyState from "../../components/EmptyState";
import { colors, spacing, typography } from "../../styles/theme";
import { MoreStackScreenProps } from "../../navigation/types";

type Props = MoreStackScreenProps<"Notifications">;

const NotificationsScreen: React.FC<Props> = () => {
  const {
    data: notifications,
    isLoading,
    refetch,
  } = trpc.notifications.list.useQuery();
  const { data: unreadCount } = trpc.notifications.getUnreadCount.useQuery(undefined, { refetchInterval: 30000 });

  const markAsRead = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const deleteNotification = trpc.notifications.delete.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const markAllAsRead = trpc.notifications.markAllAsRead.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const handleOpenAction = (url?: string | null) => {
    if (!url) return;
    Linking.openURL(url).catch(() => undefined);
  };

  const sortedNotifications = useMemo(() => {
    if (!notifications) return [];
    return [...notifications].sort(
      (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [notifications]);

  const renderNotification = ({ item }: { item: any }) => {
    const createdAt = new Date(item.createdAt);
    return (
      <GlassCard style={[styles.card, !item.isRead && styles.unreadCard]}>
        <View style={styles.cardHeader}>
          <View style={styles.titleRow}>
            <Ionicons
              name={
                item.type === "warning"
                  ? "alert-circle"
                  : item.type === "success"
                  ? "checkmark-circle"
                  : "notifications"
              }
              size={20}
              color={item.isRead ? colors.text.secondary : colors.olive}
            />
            <Text style={styles.title}>{item.title}</Text>
          </View>
          <Text style={styles.timestamp}>
            {createdAt.toLocaleDateString()} · {createdAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </Text>
        </View>
        {item.content ? <Text style={styles.body}>{item.content}</Text> : null}
        <View style={styles.cardActions}>
          {!item.isRead && (
            <TouchableOpacity onPress={() => markAsRead.mutate({ id: item.id })}>
              <Text style={styles.actionText}>Mark read</Text>
            </TouchableOpacity>
          )}
          {item.actionUrl && (
            <TouchableOpacity onPress={() => handleOpenAction(item.actionUrl)}>
              <Text style={styles.actionText}>Open</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => deleteNotification.mutate({ id: item.id })}>
            <Text style={[styles.actionText, { color: colors.russet }]}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      </GlassCard>
    );
  };

  const isRefreshing = deleteNotification.isPending || markAsRead.isPending || markAllAsRead.isPending;

  return (
    <AppLayout style={styles.screen}>
      <View style={styles.content}>
        <ScreenHeader
          title="Notifications"
          subtitle={unreadCount ? `${unreadCount} unread` : "All caught up"}
          actionLabel="Mark all read"
          onActionPress={() => markAllAsRead.mutate()}
          showSearch
        />

        {isLoading ? (
          <View style={styles.skeletonWrapper}>
            <LoadingSkeleton height={80} />
            <LoadingSkeleton height={80} />
          </View>
        ) : sortedNotifications.length === 0 ? (
          <EmptyState
            title="Nothing new"
            description="System updates, AI recommendations, and reminders will appear here."
          />
        ) : (
          <FlatList
            data={sortedNotifications}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderNotification}
            contentContainerStyle={{ paddingBottom: spacing.xxl, gap: spacing.sm }}
            refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => refetch()} />}
          />
        )}
      </View>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "transparent",
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
  },
  skeletonWrapper: {
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  card: {
    padding: spacing.md,
  },
  unreadCard: {
    borderWidth: 1,
    borderColor: colors.olive,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.sm,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
  },
  title: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    flexShrink: 1,
  },
  timestamp: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    marginLeft: spacing.sm,
  },
  body: {
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  cardActions: {
    flexDirection: "row",
    gap: spacing.md,
  },
  actionText: {
    color: colors.olive,
    fontWeight: typography.fontWeight.medium,
  },
});

export default NotificationsScreen;

