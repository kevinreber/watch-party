import React from 'react';
import { useParams } from 'react-router-dom';
import io from 'socket.io-client';

const ENDPOINT = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';

export const useGetWebSocket = (user: string) => {
  const [socket, setSocket] = React.useState<any>();
  const { roomId } = useParams<any>();

  // Initialize WebSocket connection
  React.useEffect(() => {
    const setUpNewSocket = () => {
      const newSocket = io(ENDPOINT);

      newSocket.on('connection', (socket: any) => {
        console.log(socket, socket.id);
        console.log('client connected to websocket server');
      });
      console.log(newSocket);
      console.log(user, roomId);
      newSocket.emit('join-room', user);
      // @ts-ignore
      setSocket(newSocket);
    };

    if (!socket) {
      setUpNewSocket();
    }
  }, [socket, roomId, user]);

  return { socket, roomId };
};
