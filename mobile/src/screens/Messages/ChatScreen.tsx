import React, { useEffect, useRef, useState } from "react";
import { View, Text, FlatList, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { trpc } from "../../api/trpc";
import { MoreStackScreenProps } from "../../navigation/types";
import LoadingSkeleton from "../../components/LoadingSkeleton";
import { colors, spacing, typography, borderRadius } from "../../styles/theme";
import { useAuth } from "../../contexts/AuthContext";

type Props = MoreStackScreenProps<"Chat">;

const ChatScreen: React.FC<Props> = ({ route }) => {
  const { conversationId } = route.params;
  const utils = trpc.useUtils();
  const flatListRef = useRef<FlatList>(null);

  const { user } = useAuth();
  const { data: messages, isLoading } = trpc.messages.getMessages.useQuery(
    { conversationId },
    { refetchInterval: 5000 }
  );
  const sendMessage = trpc.messages.sendMessage.useMutation({
    onSuccess: () => {
      utils.messages.getMessages.invalidate({ conversationId });
    },
  });

  const [draft, setDraft] = useState("");

  useEffect(() => {
    if (messages?.length && flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const handleSend = () => {
    if (!draft.trim()) return;
    sendMessage.mutate({ conversationId, content: draft.trim() });
    setDraft("");
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      {isLoading ? (
        <View style={styles.loadingWrapper}>
          <LoadingSkeleton height={24} />
          <LoadingSkeleton height={24} width="70%" />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages || []}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.messagesContainer}
          renderItem={({ item }) => {
            const mine = item.senderId === user?.id;
            return (
              <View style={[styles.messageBubble, mine ? styles.myMessage : styles.theirMessage]}>
                <Text style={[styles.messageText, mine && styles.myMessageText]}>{item.content}</Text>
                <Text style={[styles.messageMeta, mine && styles.myMessageText]}>
                  {new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </Text>
              </View>
            );
          }}
        />
      )}

      <View style={styles.inputRow}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Message..."
          style={styles.input}
          multiline
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSend} disabled={sendMessage.isPending}>
          {sendMessage.isPending ? (
            <Text style={styles.sendText}>...</Text>
          ) : (
            <Ionicons name="send" size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  loadingWrapper: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  messagesContainer: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  messageBubble: {
    maxWidth: "80%",
    padding: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  myMessage: {
    alignSelf: "flex-end",
    backgroundColor: colors.olive,
  },
  theirMessage: {
    alignSelf: "flex-start",
    backgroundColor: colors.glass.background,
  },
  messageText: {
    color: colors.text.primary,
  },
  myMessageText: {
    color: colors.text.inverse,
  },
  messageMeta: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    marginTop: spacing.xs,
    textAlign: "right",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.glass.border,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.glass.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginRight: spacing.sm,
    color: colors.text.primary,
  },
  sendButton: {
    backgroundColor: colors.olive,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  sendText: {
    color: colors.text.inverse,
    fontWeight: typography.fontWeight.bold,
  },
});

export default ChatScreen;

