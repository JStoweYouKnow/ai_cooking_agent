import React, { useMemo } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl } from "react-native";
import { trpc } from "../../api/trpc";
import GlassCard from "../../components/GlassCard";
import LoadingSkeleton from "../../components/LoadingSkeleton";
import EmptyState from "../../components/EmptyState";
import { colors, spacing, typography, borderRadius } from "../../styles/theme";
import { MoreStackScreenProps } from "../../navigation/types";

type Props = MoreStackScreenProps<"MessagesList">;

const MessagesListScreen: React.FC<Props> = ({ navigation }) => {
  const { data: conversations, isLoading, refetch } = trpc.messages.getConversations.useQuery();
  const { data: unreadCount } = trpc.messages.getUnreadCount.useQuery(undefined, { refetchInterval: 30000 });

  const enrichedConversations = useMemo(() => {
    if (!conversations) return [];
    return conversations.map((conversation: any) => {
      const other = conversation.otherUser;
      const lastMessage = conversation.lastMessage;
      const displayName = other?.name || other?.email || "Unknown user";
      return {
        id: conversation.id,
        name: displayName,
        preview: lastMessage?.content || "Tap to open conversation",
        timestamp: lastMessage?.createdAt ? new Date(lastMessage.createdAt) : null,
        unread: lastMessage ? !lastMessage.isRead : false,
      };
    });
  }, [conversations]);

  const handleOpenChat = (id: number, participantName?: string) => {
    navigation.navigate("Chat", { conversationId: id, participantName });
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Messages</Text>
          <Text style={styles.subtitle}>
            {unreadCount ? `${unreadCount} unread` : "Stay connected with friends"}
          </Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.skeletonWrapper}>
          <LoadingSkeleton height={70} />
          <LoadingSkeleton height={70} />
        </View>
      ) : enrichedConversations.length === 0 ? (
        <EmptyState
          title="No conversations yet"
          description="Start cooking with friends to see shared messages."
        />
      ) : (
        <FlatList
          data={enrichedConversations}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: spacing.md, gap: spacing.sm }}
          refreshControl={<RefreshControl refreshing={false} onRefresh={() => refetch()} />}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => handleOpenChat(item.id, item.name)}>
              <GlassCard style={styles.convCard}>
                <View style={styles.convRow}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{item.name[0]}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.convHeader}>
                      <Text style={styles.convName}>{item.name}</Text>
                      {item.timestamp && (
                        <Text style={styles.convTime}>
                          {item.timestamp.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        </Text>
                      )}
                    </View>
                    <Text style={[styles.convPreview, item.unread && styles.convPreviewUnread]} numberOfLines={1}>
                      {item.preview}
                    </Text>
                  </View>
                  {item.unread && <View style={styles.unreadDot} />}
                </View>
              </GlassCard>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    fontSize: typography.fontSize.xxxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.navy,
  },
  subtitle: {
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  skeletonWrapper: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  convCard: {
    padding: spacing.sm,
  },
  convRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: colors.glass.background,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontWeight: typography.fontWeight.bold,
    color: colors.navy,
  },
  convHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  convName: {
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  convTime: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.xs,
  },
  convPreview: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.sm,
    marginTop: 2,
  },
  convPreviewUnread: {
    color: colors.text.primary,
    fontWeight: typography.fontWeight.medium,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: borderRadius.full,
    backgroundColor: colors.russet,
  },
});

export default MessagesListScreen;

