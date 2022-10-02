import React from 'react';
import { useParams } from 'react-router-dom';
import io from 'socket.io-client';
import { SOCKET_CLIENT } from '@socket-client';

const { EVENTS, EMITTER } = SOCKET_CLIENT;

const ENDPOINT = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';
const newSocket = io(ENDPOINT);

export const useGetWebSocket = (user: string) => {
  const [socket, setSocket] = React.useState<any>();
  const { roomId } = useParams<any>();
  const [isConnected, setIsConnected] = React.useState(newSocket.connected);

  // Initialize WebSocket connection
  React.useEffect(() => {
    const setUpNewSocket = () => {
      newSocket.on('connect', (socket: SocketIOClient.Socket) => {
        console.log('client connected to websocket server');
        setIsConnected(true);
      });
      // @ts-ignore
      setSocket(newSocket);

      console.log(newSocket);
      console.log(user, roomId);

      // return () => newSocket.close();
      return () => {
        newSocket.off(EVENTS.CONNECT);
      };
    };

    if (user && !isConnected) {
      setUpNewSocket();
    }
  }, []);

  React.useEffect(() => {
    const joinRoom = () => {
      socket.emit(EMITTER.JOIN_ROOM, { username: user });

      return () => socket.off(EMITTER.JOIN_ROOM);
    };

    if (user && isConnected && socket) {
      joinRoom();
    }
  }, [isConnected]);

  return { socket };
};
