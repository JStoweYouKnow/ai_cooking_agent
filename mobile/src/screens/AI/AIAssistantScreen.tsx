import React, { useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { trpc } from "../../api/trpc";
import AppLayout from "../../components/layout/AppLayout";
import ScreenHeader from "../../components/layout/ScreenHeader";
import GlassCard from "../../components/GlassCard";
import RecipeCard from "../../components/RecipeCard";
import EmptyState from "../../components/EmptyState";
import { colors, spacing, typography, borderRadius } from "../../styles/theme";
import { MoreStackScreenProps } from "../../navigation/types";
import type { Recipe } from "../../types";
import { useSubscription } from "../../hooks/useSubscription";
import { shouldShowPaywallForAiChat, incrementUsage, USAGE_PAYWALL } from "../../utils/usagePaywall";
import { CREATOR_CONFIG } from "../../constants/creator";
import PaywallPrompt from "../../components/PaywallPrompt";
import { addBreadcrumb } from "../../utils/analytics";

type Props = MoreStackScreenProps<"AIAssistant">;

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
  recipe?: Recipe;
};

const initialAssistantMessage =
  "Hi! I'm Sous, your AI cooking assistant. Ask me anything—meal planning ideas, substitution tips, or creative ways to use what's in your pantry.";

const AIAssistantScreen: React.FC<Props> = ({ navigation }) => {
  const { isPremium } = useSubscription();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "assistant-0", role: "assistant", content: initialAssistantMessage },
  ]);
  const [input, setInput] = useState("");
  const flatListRef = useRef<FlatList<ChatMessage>>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const chatMutation = trpc.ai.chat.useMutation({
    onSuccess: (data) => {
      addBreadcrumb("ai", "AI chat response received", { hasRecipe: !!data?.recipe });
      setChatError(null);
      incrementUsage(USAGE_PAYWALL.AI_CHATS.key).catch(() => {});
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: data.reply,
          recipe: data.recipe,
        },
      ]);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    },
    onError: (err) => {
      setChatError(err.message || "Something went wrong. Please try again.");
    },
  });

  const recentMessagesForLLM = useMemo(
    () =>
      messages.slice(-12).map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
    [messages]
  );

  const quickPrompts = [
    "Plan dinners for the week with my pantry staples",
    "Create a vegetarian menu for 4 people",
    "Give me substitutions for eggs in baking",
    "Suggest a 20-minute lunch using chicken",
  ];

  const handleSend = async () => {
    if (!input.trim()) return;
    const shouldShow = await shouldShowPaywallForAiChat(isPremium);
    if (shouldShow) {
      setShowPaywall(true);
      return;
    }
    addBreadcrumb("ai", "AI chat message sent", { length: input.trim().length });
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input.trim(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    chatMutation.mutate({
      messages: [...recentMessagesForLLM, { role: "user", content: userMessage.content }],
    });
  };

  const handlePrompt = (prompt: string) => {
    setInput(prompt);
  };

  return (
    <AppLayout style={styles.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
        <ScreenHeader
          title="Sous Assistant"
          subtitle="Personal cooking coach powered by AI"
          showBack
          onBackPress={() => navigation.goBack()}
        />

        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.chatContainer}
          renderItem={({ item }) => (
            <View
              style={[styles.messageRow, item.role === "assistant" ? styles.assistantRow : styles.userRow]}
              accessible
              accessibilityLabel={item.role === "assistant" ? `Sous: ${item.content}` : `You: ${item.content}`}
            >
              <View
                style={[
                  styles.messageBubble,
                  item.role === "assistant" ? styles.assistantBubble : styles.userBubble,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    item.role === "assistant" ? styles.assistantText : styles.userText,
                  ]}
                >
                  {item.content}
                </Text>
              </View>
              {item.role === "assistant" && item.recipe ? (
                <View style={styles.recipeCardContainer}>
                  <RecipeCard
                    recipe={item.recipe}
                    onPress={() =>
                      (navigation as any).navigate("Recipes", {
                        screen: "RecipeDetail",
                        params: { id: item.recipe!.id },
                      })
                    }
                  />
                </View>
              ) : null}
            </View>
          )}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        {chatError ? (
          <EmptyState
            variant="error"
            title="AI unavailable"
            description={chatError}
            primaryActionLabel="Retry"
            onPrimaryAction={() => {
              setChatError(null);
              chatMutation.mutate({ messages: recentMessagesForLLM });
            }}
            style={styles.errorCard}
          />
        ) : null}

        <GlassCard style={styles.promptCard} accessible accessibilityLabel="Quick prompt suggestions">
          <Text style={styles.promptTitle}>Try asking:</Text>
          <View style={styles.promptPills}>
            {quickPrompts.map((prompt) => (
              <TouchableOpacity
                key={prompt}
                style={styles.promptPill}
                onPress={() => handlePrompt(prompt)}
                accessibilityRole="button"
                accessibilityLabel={`Suggestion: ${prompt}`}
                accessibilityHint="Double tap to use this prompt"
              >
                <Text style={styles.promptText}>{prompt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </GlassCard>

        <View style={styles.inputRow} accessibilityLabel="Chat input">
          <TextInput
            style={styles.input}
            placeholder="Ask Sous anything..."
            value={input}
            onChangeText={setInput}
            multiline
            accessibilityLabel="Message to Sous"
            accessibilityHint="Type your question or request for the AI cooking assistant"
          />
          <TouchableOpacity
            style={styles.sendButton}
            onPress={handleSend}
            disabled={chatMutation.isPending}
            accessibilityRole="button"
            accessibilityLabel={chatMutation.isPending ? "Sending" : "Send message"}
            accessibilityHint="Sends your message to Sous"
          >
            {chatMutation.isPending ? (
              <ActivityIndicator color={colors.text.inverse} />
            ) : (
              <Ionicons name="send" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>

        {showPaywall ? (
          <PaywallPrompt
            variant="modal"
            feature="AI chats"
            currentUsage={2}
            limit={2}
            message="You've used your free AI chats. Upgrade for unlimited Sous assistance."
            showClose
            onClose={() => setShowPaywall(false)}
            creatorName={CREATOR_CONFIG.name}
            creatorEndorsement={CREATOR_CONFIG.endorsement}
          />
        ) : null}
      </KeyboardAvoidingView>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "transparent",
  },
  flex: {
    flex: 1,
  },
  chatContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  messageRow: {
    alignItems: "flex-start",
  },
  assistantRow: {
    alignSelf: "flex-start",
    width: "100%",
  },
  userRow: {
    alignSelf: "flex-end",
    width: "100%",
    alignItems: "flex-end",
  },
  recipeCardContainer: {
    marginTop: spacing.sm,
    width: "100%",
    maxWidth: 340,
  },
  messageBubble: {
    padding: spacing.sm,
    borderRadius: borderRadius.lg,
    maxWidth: "90%",
  },
  assistantBubble: {
    alignSelf: "flex-start",
    backgroundColor: colors.glass.background,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: colors.olive,
  },
  assistantText: {
    color: colors.text.primary,
  },
  userText: {
    color: colors.text.inverse,
  },
  messageText: {
    fontSize: typography.fontSize.md,
    lineHeight: 20,
  },
  errorCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  promptCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  promptTitle: {
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  promptPills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  promptPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.glass.background,
  },
  promptText: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.sm,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: colors.glass.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    color: colors.text.primary,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: colors.olive,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default AIAssistantScreen;

