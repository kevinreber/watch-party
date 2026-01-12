import { useState, useEffect } from 'react';
import type { Socket } from 'socket.io-client';
import { SOCKET_CLIENT_EMITTER } from '@socket-client';
import { MessageTypes } from '@types';

export const useHandleMessages = (socket: Socket | undefined, user: string) => {
  const [messages, setMessages] = useState<MessageTypes[]>([]);
  const [userIsTyping, setIsUserTyping] = useState(false);
  const [isTypingMessage, setIsTypingMessage] = useState('');

  const sendMessage = (data: { content: string }) => {
    const { content } = data;
    const messageData: MessageTypes = {
      type: 'chat',
      content,
      created_at: new Date().getTime(),
      username: user,
    };

    setMessages((m) => [...m, messageData]);
    socket?.emit(SOCKET_CLIENT_EMITTER.sendMessage, messageData);
  };

  const appendMessage = (message: MessageTypes) => {
    setMessages((m) => [...m, message]);
  };

  // Socket Event Listener - When new user joins chat
  useEffect(() => {
    if (!socket) return;

    const receiveMessageListener = (data: MessageTypes) => {
      setMessages((state) => [...state, data]);
    };

    socket.on(`MSG:receive-message`, receiveMessageListener);

    return () => {
      socket.off(`MSG:receive-message`, receiveMessageListener);
    };
  }, [socket]);

  // Socket Event Listener - When user is typing
  useEffect(() => {
    if (!socket) return;

    const handleUserIsTyping = (userTypingMessage: string) => {
      setIsUserTyping(true);
      setIsTypingMessage(userTypingMessage);
    };

    socket.on(`MSG:user-is-typing`, handleUserIsTyping);

    return () => {
      socket.off(`MSG:user-is-typing`, handleUserIsTyping);
    };
  }, [socket]);

  // Socket Event Listener - When no user is typing
  useEffect(() => {
    if (!socket) return;

    const noUserIsTyping = () => {
      setIsUserTyping(false);
    };

    socket.on(`MSG:no-user-is-typing`, noUserIsTyping);

    return () => {
      socket.off(`MSG:no-user-is-typing`, noUserIsTyping);
    };
  }, [socket]);

  return { messages, appendMessage, sendMessage, userIsTyping, isTypingMessage };
};
