import React from 'react';
import { SOCKET_CLIENT_EMITTER } from '@socket-client';
import { MessageTypes } from '@types';

interface SendMessageData {
  content: string;
}

type SocketType = SocketIOClient.Socket | null;

export const useHandleMessages = (socket: SocketType, user: string) => {
  const [messages, setMessages] = React.useState<MessageTypes[]>([]);
  const [userIsTyping, setIsUserTyping] = React.useState<boolean>(false);
  const [isTypingMessage, setIsTypingMessage] = React.useState<string>('');

  const sendMessage = React.useCallback(
    (data: SendMessageData): void => {
      if (!socket) return;

      const { content } = data;
      const messageData: MessageTypes = {
        type: 'chat',
        content,
        created_at: new Date(),
        username: user,
        userId: '',
      };

      setMessages((m) => [...m, messageData]);
      socket.emit(SOCKET_CLIENT_EMITTER.sendMessage, messageData);
    },
    [socket, user]
  );

  const appendMessage = React.useCallback((message: MessageTypes): void => {
    setMessages((m) => [...m, message]);
  }, []);

  // Socket Event Listener - When new user joins chat or message received
  React.useEffect(() => {
    if (!socket) return;

    const receiveMessageListener = (data: MessageTypes): void => {
      setMessages((state) => [...state, data]);
    };

    socket.on('MSG:receive-message', receiveMessageListener);

    return () => {
      socket.off('MSG:receive-message', receiveMessageListener);
    };
  }, [socket]);

  // Socket Event Listener - When user is typing
  React.useEffect(() => {
    if (!socket) return;

    const handleUserIsTyping = (userTypingMessage: string): void => {
      setIsUserTyping(true);
      setIsTypingMessage(userTypingMessage);
    };

    socket.on('MSG:user-is-typing', handleUserIsTyping);

    return () => {
      socket.off('MSG:user-is-typing', handleUserIsTyping);
    };
  }, [socket]);

  // Socket Event Listener - When user stops typing
  React.useEffect(() => {
    if (!socket) return;

    const handleNoUserIsTyping = (): void => {
      setIsUserTyping(false);
    };

    socket.on('MSG:no-user-is-typing', handleNoUserIsTyping);

    return () => {
      socket.off('MSG:no-user-is-typing', handleNoUserIsTyping);
    };
  }, [socket]);

  return { messages, appendMessage, sendMessage, userIsTyping, isTypingMessage };
};
