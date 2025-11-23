"use client";
import React, { useState } from 'react';
import { MessageSquare, Send, ArrowLeft, User as UserIcon } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';

export default function MessagesPage() {
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [messageContent, setMessageContent] = useState('');
  
  const { data: currentUser } = trpc.auth.me.useQuery();
  const { data: conversations, refetch: refetchConversations } = trpc.messages.getConversations.useQuery();
  const { data: conversation, refetch: refetchConversation } = trpc.messages.getConversation.useQuery(
    { conversationId: selectedConversationId! },
    { enabled: !!selectedConversationId }
  );
  const { data: messages, refetch: refetchMessages } = trpc.messages.getMessages.useQuery(
    { conversationId: selectedConversationId! },
    { enabled: !!selectedConversationId, refetchInterval: 5000 }
  );
  const { data: unreadCount } = trpc.messages.getUnreadCount.useQuery(undefined, {
    refetchInterval: 30000,
  });

  const sendMessageMutation = trpc.messages.sendMessage.useMutation({
    onSuccess: () => {
      setMessageContent('');
      refetchMessages();
      refetchConversations();
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageContent.trim() || !selectedConversationId) return;

    sendMessageMutation.mutate({
      conversationId: selectedConversationId,
      content: messageContent.trim(),
    });
  };

  const selectedConversation = conversations?.find(c => c.id === selectedConversationId);

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-white dark:bg-gray-900">
      {/* Conversations List */}
      <div className="w-80 border-r border-gray-200 dark:border-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <h1 className="text-xl font-semibold text-[var(--russet-brown)]">Messages</h1>
          {unreadCount !== undefined && unreadCount > 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {unreadCount} unread {unreadCount === 1 ? 'message' : 'messages'}
            </p>
          )}
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2">
            {conversations && conversations.length > 0 ? (
              conversations.map((conv) => {
                const otherUser = conv.otherUser;
                const lastMessage = conv.lastMessage;
                const hasUnread = lastMessage && currentUser && !lastMessage.isRead && lastMessage.senderId !== currentUser.id;
                
                return (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConversationId(conv.id)}
                    className={cn(
                      "w-full text-left p-3 rounded-lg mb-2 transition-colors",
                      selectedConversationId === conv.id
                        ? "bg-[var(--russet-brown)]/10 border border-[var(--russet-brown)]/20"
                        : "hover:bg-gray-100 dark:hover:bg-gray-800",
                      hasUnread && "font-semibold"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-pc-olive text-white">
                          {otherUser?.name
                            ? otherUser.name
                                .split(' ')
                                .map(n => n[0])
                                .join('')
                                .toUpperCase()
                                .slice(0, 2)
                            : otherUser?.email?.[0].toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "text-sm truncate",
                          hasUnread ? "font-semibold" : "font-medium"
                        )}>
                          {otherUser?.name || otherUser?.email || 'Unknown User'}
                        </p>
                        {lastMessage && (
                          <p className={cn(
                            "text-xs truncate mt-1",
                            hasUnread
                              ? "text-gray-900 dark:text-gray-100"
                              : "text-gray-500 dark:text-gray-400"
                          )}>
                            {lastMessage.content}
                          </p>
                        )}
                        {lastMessage && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            {formatDistanceToNow(new Date(lastMessage.createdAt), { addSuffix: true })}
                          </p>
                        )}
                      </div>
                      {hasUnread && (
                        <div className="h-2 w-2 rounded-full bg-[var(--russet-brown)]" />
                      )}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No conversations yet</p>
                <p className="text-xs mt-1">Start a conversation with another user</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Message View */}
      <div className="flex-1 flex flex-col">
        {selectedConversationId ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedConversationId(null)}
                className="lg:hidden"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              {selectedConversation?.otherUser && (
                <>
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-pc-olive text-white">
                      {selectedConversation.otherUser.name
                        ? selectedConversation.otherUser.name
                            .split(' ')
                            .map(n => n[0])
                            .join('')
                            .toUpperCase()
                            .slice(0, 2)
                        : selectedConversation.otherUser.email?.[0].toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">
                      {selectedConversation.otherUser.name || selectedConversation.otherUser.email || 'Unknown User'}
                    </p>
                    {selectedConversation.otherUser.email && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {selectedConversation.otherUser.email}
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages && messages.length > 0 ? (
                  messages.map((message) => {
                    const isCurrentUser = currentUser && message.senderId === currentUser.id;
                    
                    return (
                      <div
                        key={message.id}
                        className={cn(
                          "flex gap-3",
                          isCurrentUser && "flex-row-reverse"
                        )}
                      >
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarFallback className="bg-pc-olive text-white text-xs">
                            <UserIcon className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div className={cn(
                          "flex-1 max-w-[70%]",
                          isCurrentUser && "flex flex-col items-end"
                        )}>
                          <div className={cn(
                            "rounded-lg px-4 py-2",
                            isCurrentUser
                              ? "bg-[var(--russet-brown)] text-white"
                              : "bg-gray-100 dark:bg-gray-800"
                          )}>
                            <p className="text-sm whitespace-pre-wrap break-words">
                              {message.content}
                            </p>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 px-1">
                            {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No messages yet</p>
                    <p className="text-xs mt-1">Start the conversation!</p>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 dark:border-gray-800">
              <div className="flex gap-2">
                <Input
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1"
                  disabled={sendMessageMutation.isPending}
                />
                <Button
                  type="submit"
                  disabled={!messageContent.trim() || sendMessageMutation.isPending}
                  className="bg-[var(--russet-brown)] hover:bg-[var(--russet-brown)]/90"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Select a conversation</p>
              <p className="text-sm mt-2">Choose a conversation from the list to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

