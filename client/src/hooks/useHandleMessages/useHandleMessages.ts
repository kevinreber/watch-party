import React from 'react';
import { SOCKET_CLIENT_EMITTER, SOCKET_CLIENT_LISTENER } from '@socket-client';

export const useHandleMessages = (socket: SocketIOClient.Socket, user: string) => {
  const [messages, setMessages] = React.useState([]);

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
  // @ts-ignore
  React.useEffect(() => {
    if (!socket) return;
    // @ts-ignore
    socket.on(SOCKET_CLIENT_LISTENER.receiveMessage, (data) => {
      // @ts-ignore
      setMessages((m) => [...m, data]);
    });

    // @ts-ignore
    return () => socket.off(SOCKET_CLIENT_LISTENER.receiveMessage);
  }, [socket]);

  // * Socket Event Listener
  // * When new user joins chat
  // @ts-ignore
  React.useEffect(() => {
    if (!socket) return;

    // @ts-ignore
    socket.on(SOCKET_CLIENT_LISTENER.userUpdated, (data: { type: string; user: string; username: string }) => {
      const content =
        data.type === 'user-join' ? `${data.username} has joined` : `${data.user} changed name to ${data.username}`;
      const message = {
        type: data.type,
        content,
        created_at: new Date().getTime(),
        username: data.username,
      };

      // @ts-ignore
      // setMessages((m) => [...m, message]);
      appendMessage(message);
    });

    // @ts-ignore
    return () => socket.off(SOCKET_CLIENT_LISTENER.userUpdated);
  }, [socket]);

  return { messages, appendMessage, sendMessage };
};
