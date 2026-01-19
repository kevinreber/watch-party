import { useState, useEffect } from "react";
import type { Socket } from "socket.io-client";
import { SOCKET_CLIENT_EMITTER } from "~/utils/socket-client";

interface Message {
  type: string;
  content: string;
  created_at: number;
  username: string;
}

export const useHandleMessages = (socket: Socket | null, user: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [userIsTyping, setIsUserTyping] = useState(false);
  const [isTypingMessage, setIsTypingMessage] = useState("");

  const sendMessage = (data: { content: string }) => {
    if (!socket) return;

    const { content } = data;
    const messageData: Message = {
      type: "chat",
      content,
      created_at: new Date().getTime(),
      username: user,
    };

    setMessages((m) => [...m, messageData]);
    socket.emit(SOCKET_CLIENT_EMITTER.sendMessage, messageData);
  };

  const appendMessage = (message: Message | string) => {
    setMessages((m) => [...m, message as Message]);
  };

  // Socket Event Listener - When new message received
  useEffect(() => {
    if (!socket) return;

    const receiveMessageListener = (data: Message) => {
      setMessages((state) => [...state, data]);
    };

    socket.on("MSG:receive-message", receiveMessageListener);

    return () => {
      socket.off("MSG:receive-message", receiveMessageListener);
    };
  }, [socket]);

  // Socket Event Listener - When user is typing
  useEffect(() => {
    if (!socket) return;

    const onUserIsTyping = (userTypingMessage: string) => {
      setIsUserTyping(true);
      setIsTypingMessage(userTypingMessage);
    };

    socket.on("MSG:user-is-typing", onUserIsTyping);

    return () => {
      socket.off("MSG:user-is-typing", onUserIsTyping);
    };
  }, [socket]);

  // Socket Event Listener - When no user is typing
  useEffect(() => {
    if (!socket) return;

    const onNoUserIsTyping = () => {
      setIsUserTyping(false);
    };

    socket.on("MSG:no-user-is-typing", onNoUserIsTyping);

    return () => {
      socket.off("MSG:no-user-is-typing", onNoUserIsTyping);
    };
  }, [socket]);

  return { messages, appendMessage, sendMessage, userIsTyping, isTypingMessage };
};
