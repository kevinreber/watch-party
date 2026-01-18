import React from 'react';
import { useParams } from 'react-router-dom';
import io, { Socket } from 'socket.io-client';
import { SOCKET_CLIENT } from '@socket-client';

const { EMITTER } = SOCKET_CLIENT;

const ENDPOINT = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';

// Reconnection configuration
const SOCKET_OPTIONS = {
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
  transports: ['websocket', 'polling'] as ('websocket' | 'polling')[],
};

interface UseGetWebSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  connectionError: string | null;
  reconnect: () => void;
}

interface RouteParams {
  roomId: string;
}

export const useGetWebSocket = (user: string): UseGetWebSocketReturn => {
  const [socket, setSocket] = React.useState<Socket | null>(null);
  const [isConnected, setIsConnected] = React.useState<boolean>(false);
  const [connectionError, setConnectionError] = React.useState<string | null>(null);
  const { roomId } = useParams<RouteParams>();
  const socketRef = React.useRef<Socket | null>(null);

  // Initialize WebSocket connection
  React.useEffect(() => {
    if (!user) return;

    const newSocket = io(ENDPOINT, SOCKET_OPTIONS);
    socketRef.current = newSocket;

    newSocket.on('connect', () => {
      console.log('Connected to WebSocket server');
      setIsConnected(true);
      setConnectionError(null);
    });

    newSocket.on('disconnect', (reason: string) => {
      console.log('Disconnected from WebSocket server:', reason);
      setIsConnected(false);

      if (reason === 'io server disconnect') {
        // Server initiated disconnect, try to reconnect
        newSocket.connect();
      }
    });

    newSocket.on('connect_error', (error: Error) => {
      console.error('WebSocket connection error:', error.message);
      setConnectionError(error.message);
      setIsConnected(false);
    });

    newSocket.io.on('reconnect', (attemptNumber: number) => {
      console.log('Reconnected after', attemptNumber, 'attempts');
      setIsConnected(true);
      setConnectionError(null);
    });

    newSocket.io.on('reconnect_attempt', (attemptNumber: number) => {
      console.log('Reconnection attempt:', attemptNumber);
    });

    newSocket.io.on('reconnect_error', (error: Error) => {
      console.error('Reconnection error:', error.message);
    });

    newSocket.io.on('reconnect_failed', () => {
      console.error('Failed to reconnect after all attempts');
      setConnectionError('Failed to reconnect to server');
    });

    newSocket.on('error', (error: { message: string }) => {
      console.error('Socket error:', error.message);
      setConnectionError(error.message);
    });

    setSocket(newSocket);

    return () => {
      newSocket.off('connect');
      newSocket.off('disconnect');
      newSocket.off('connect_error');
      newSocket.off('error');
      newSocket.io.off('reconnect');
      newSocket.io.off('reconnect_attempt');
      newSocket.io.off('reconnect_error');
      newSocket.io.off('reconnect_failed');
      newSocket.close();
    };
  }, [user]);

  // Join room when connected
  React.useEffect(() => {
    if (!socket || !isConnected || !user || !roomId) return;

    socket.emit(EMITTER.JOIN_ROOM, { username: user, roomId });
    console.log('Joined room:', roomId);

    return () => {
      socket.off(EMITTER.JOIN_ROOM);
    };
  }, [socket, isConnected, user, roomId]);

  // Manual reconnect function
  const reconnect = React.useCallback(() => {
    if (socketRef.current) {
      socketRef.current.connect();
    }
  }, []);

  return { socket, isConnected, connectionError, reconnect };
};
