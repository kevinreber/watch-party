import { useState, useEffect, useCallback, useRef } from "react";
import type { RealtimeChannel, Message as AblyMessage } from "ably";

interface Message {
  type: string;
  content: string;
  created_at: number;
  username: string;
  senderId?: string;
}

export const useHandleMessagesAbly = (
  channel: RealtimeChannel | null,
  user: string,
  clientId: string | undefined
) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [userIsTyping, setUserIsTyping] = useState(false);
  const [isTypingMessage, setIsTypingMessage] = useState("");
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const sendMessage = useCallback(
    (data: { content: string }) => {
      if (!channel) return;

      const { content } = data;
      const messageData: Message = {
        type: "chat",
        content,
        created_at: new Date().getTime(),
        username: user,
        senderId: clientId,
      };

      // Add to local messages immediately
      setMessages((m) => [...m, messageData]);

      // Publish to channel
      channel.publish("chat-message", messageData);
    },
    [channel, user, clientId]
  );

  const appendMessage = useCallback((message: Message | string) => {
    setMessages((m) => [...m, message as Message]);
  }, []);

  const emitTyping = useCallback(() => {
    if (!channel) return;

    channel.publish("user-typing", {
      username: user,
      senderId: clientId,
      message: `${user} is typing a message...`,
    });

    // Clear typing indicator after 3 seconds
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      channel.publish("user-stop-typing", { senderId: clientId });
    }, 3000);
  }, [channel, user, clientId]);

  const emitStopTyping = useCallback(() => {
    if (!channel) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    channel.publish("user-stop-typing", { senderId: clientId });
  }, [channel, clientId]);

  // Subscribe to chat messages
  useEffect(() => {
    if (!channel) return;

    const onMessage = (message: AblyMessage) => {
      const data = message.data as Message;
      // Don't add our own messages (we add them locally on send)
      if (data.senderId === clientId) return;

      setMessages((state) => [...state, data]);
    };

    channel.subscribe("chat-message", onMessage);

    return () => {
      channel.unsubscribe("chat-message", onMessage);
    };
  }, [channel, clientId]);

  // Subscribe to typing indicators
  useEffect(() => {
    if (!channel) return;

    const onUserTyping = (message: AblyMessage) => {
      const data = message.data as { senderId?: string; message: string };
      // Ignore our own typing events
      if (data.senderId === clientId) return;

      setUserIsTyping(true);
      setIsTypingMessage(data.message);
    };

    const onUserStopTyping = (message: AblyMessage) => {
      const data = message.data as { senderId?: string };
      // Ignore our own typing events
      if (data.senderId === clientId) return;

      setUserIsTyping(false);
      setIsTypingMessage("");
    };

    channel.subscribe("user-typing", onUserTyping);
    channel.subscribe("user-stop-typing", onUserStopTyping);

    return () => {
      channel.unsubscribe("user-typing", onUserTyping);
      channel.unsubscribe("user-stop-typing", onUserStopTyping);
    };
  }, [channel, clientId]);

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return {
    messages,
    appendMessage,
    sendMessage,
    userIsTyping,
    isTypingMessage,
    emitTyping,
    emitStopTyping,
  };
};
