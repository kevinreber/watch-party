import React from 'react';
import { useParams } from 'react-router-dom';
import io from 'socket.io-client';
import { SOCKET_CLIENT_EVENTS, SOCKET_CLIENT_EMITTER } from '@socket-client';

const ENDPOINT = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';

export const useGetWebSocket = (user: string) => {
  const [socket, setSocket] = React.useState<any>();
  const { roomId } = useParams<any>();

  // Initialize WebSocket connection
  React.useEffect(() => {
    const setUpNewSocket = () => {
      const newSocket = io(ENDPOINT);

      newSocket.on(SOCKET_CLIENT_EVENTS.connection, (socket: SocketIOClient.Socket) => {
        console.log(socket, socket.id);
        console.log('client connected to websocket server');
      });
      console.log(newSocket);
      console.log(user, roomId);
      newSocket.emit(SOCKET_CLIENT_EMITTER.joinRoom, user);
      // @ts-ignore
      setSocket(newSocket);
    };

    if (!socket) {
      setUpNewSocket();
    }
  }, [socket, roomId, user]);

  return { socket, roomId };
};
