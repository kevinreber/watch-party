import React from 'react';
import { SOCKET_CLIENT_EMITTER } from '@socket-client';
import { MessageTypes } from '@types';

export const useHandleMessages = (socket: SocketIOClient.Socket, user: string) => {
  const [messages, setMessages] = React.useState([]);
  const [userIsTyping, setIsUserTyping] = React.useState(false);

  const sendMessage = (data: any) => {
    const { content } = data;
    const messageData = {
      type: 'chat',
      content,
      created_at: new Date().getTime(),
      username: user,
    };

    // @ts-ignore
    setMessages((m) => [...m, messageData]);
    socket.emit(SOCKET_CLIENT_EMITTER.sendMessage, messageData);
  };

  const appendMessage = (message: string) => {
    // @ts-ignore
    setMessages((m) => [...m, message]);
  };

  // * Socket Event Listener
  // * When new user joins chat
  // @ts-ignore
  React.useEffect(() => {
    if (!socket) return;

    const receiveMessageListener = (data: MessageTypes) => {
      // @ts-ignore
      setMessages((state) => [...state, data]);
    };

    socket.on(`MSG:receive-message`, receiveMessageListener);

    return () => socket.off(`MSG:receive-message`, receiveMessageListener);
  }, [socket]);

  // * Socket Event Listener
  // * When user is typing
  // @ts-ignore
  React.useEffect(() => {
    if (!socket) return;

    const userIsTyping = (data: MessageTypes) => {
      setIsUserTyping(true);
      // @ts-ignore
      setMessages((state) => [...state, data]);
    };

    socket.on(`MSG:user-is-typing`, userIsTyping);

    return () => socket.off(`MSG:user-is-typing`, userIsTyping);
  }, [socket]);

  // * Socket Event Listener
  // * When user is typing
  // @ts-ignore
  React.useEffect(() => {
    if (!socket) return;

    const noUserIsTyping = () => {
      setIsUserTyping(false);
    };

    socket.on(`MSG:no-user-is-typing`, noUserIsTyping);

    return () => socket.off(`MSG:no-user-is-typing`, noUserIsTyping);
  }, [socket]);

  return { messages, appendMessage, sendMessage, userIsTyping };
};
