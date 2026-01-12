import { useState, useEffect } from "react";
import { useParams } from "react-router";
import { io, Socket } from "socket.io-client";
import { SOCKET_CLIENT } from "@socket-client";

const { EVENTS, EMITTER } = SOCKET_CLIENT;

const ENDPOINT = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
const newSocket = io(ENDPOINT);

export const useGetWebSocket = (user: string) => {
  const [socket, setSocket] = useState<Socket | undefined>();
  const { roomId } = useParams();
  const [isConnected, setIsConnected] = useState(newSocket.connected);

  // Initialize WebSocket connection
  useEffect(() => {
    const setUpNewSocket = () => {
      newSocket.on("connect", () => {
        console.log("client connected to websocket server");
        setIsConnected(true);
      });

      setSocket(newSocket);

      console.log(newSocket);
      console.log(user, roomId);

      return () => {
        newSocket.off(EVENTS.CONNECT);
      };
    };

    if (user && !isConnected) {
      setUpNewSocket();
    }
  }, [user, isConnected, roomId]);

  useEffect(() => {
    const joinRoom = () => {
      socket?.emit(EMITTER.JOIN_ROOM, { username: user });

      return () => {
        socket?.off(EMITTER.JOIN_ROOM);
      };
    };

    if (user && isConnected && socket) {
      joinRoom();
    }
  }, [isConnected, socket, user]);

  return { socket };
};
