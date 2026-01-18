import { useState, useEffect } from "react";
import { useParams } from "react-router";
import { io, Socket } from "socket.io-client";
import { SOCKET_CLIENT } from "~/utils/socket-client";

const { EVENTS, EMITTER } = SOCKET_CLIENT;

// Socket connection - now on same origin since server is integrated
const getSocketEndpoint = () => {
  if (typeof window === "undefined") return "";
  // In development, connect to the same server running React Router
  return window.location.origin;
};

let socketInstance: Socket | null = null;

const getSocket = () => {
  if (!socketInstance && typeof window !== "undefined") {
    socketInstance = io(getSocketEndpoint(), {
      transports: ["websocket", "polling"],
    });
  }
  return socketInstance;
};

export const useGetWebSocket = (user: string) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const { roomId } = useParams();
  const [isConnected, setIsConnected] = useState(false);

  // Initialize WebSocket connection
  useEffect(() => {
    if (typeof window === "undefined") return;

    const newSocket = getSocket();
    if (!newSocket) return;

    const onConnect = () => {
      console.log("Client connected to websocket server");
      setIsConnected(true);
    };

    const onDisconnect = () => {
      console.log("Client disconnected from websocket server");
      setIsConnected(false);
    };

    newSocket.on(EVENTS.CONNECT, onConnect);
    newSocket.on(EVENTS.DISCONNECT, onDisconnect);

    if (newSocket.connected) {
      setIsConnected(true);
    }

    setSocket(newSocket);

    return () => {
      newSocket.off(EVENTS.CONNECT, onConnect);
      newSocket.off(EVENTS.DISCONNECT, onDisconnect);
    };
  }, []);

  // Join room when connected
  useEffect(() => {
    if (user && isConnected && socket) {
      socket.emit(EMITTER.JOIN_ROOM, { username: user, roomId });
    }
  }, [user, isConnected, socket, roomId]);

  return { socket, isConnected };
};
