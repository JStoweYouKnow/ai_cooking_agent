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
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { trpc } from "../../api/trpc";
import AppLayout from "../../components/layout/AppLayout";
import ScreenHeader from "../../components/layout/ScreenHeader";
import GlassCard from "../../components/GlassCard";
import { colors, spacing, typography, borderRadius } from "../../styles/theme";
import { MoreStackScreenProps } from "../../navigation/types";

type Props = MoreStackScreenProps<"AIAssistant">;

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
};

const initialAssistantMessage =
  "Hi! I'm Sous, your AI cooking assistant. Ask me anything—meal planning ideas, substitution tips, or creative ways to use what's in your pantry.";

const AIAssistantScreen: React.FC<Props> = ({ navigation }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "assistant-0", role: "assistant", content: initialAssistantMessage },
  ]);
  const [input, setInput] = useState("");
  const flatListRef = useRef<FlatList<ChatMessage>>(null);

  const chatMutation = trpc.ai.chat.useMutation({
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: data.reply,
        },
      ]);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    },
    onError: (err) => {
      Alert.alert("AI unavailable", err.message || "Please try again soon.");
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

  const handleSend = () => {
    if (!input.trim()) return;
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
          )}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        <GlassCard style={styles.promptCard}>
          <Text style={styles.promptTitle}>Try asking:</Text>
          <View style={styles.promptPills}>
            {quickPrompts.map((prompt) => (
              <TouchableOpacity key={prompt} style={styles.promptPill} onPress={() => handlePrompt(prompt)}>
                <Text style={styles.promptText}>{prompt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </GlassCard>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Ask Sous anything..."
            value={input}
            onChangeText={setInput}
            multiline
          />
          <TouchableOpacity
            style={styles.sendButton}
            onPress={handleSend}
            disabled={chatMutation.isPending}
          >
            {chatMutation.isPending ? (
              <ActivityIndicator color={colors.text.inverse} />
            ) : (
              <Ionicons name="send" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
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

