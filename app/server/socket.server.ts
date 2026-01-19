import { Server as SocketServer } from "socket.io";
import type { Server as HttpServer } from "http";
import { Room } from "./Room.server";
import { SOCKET_SERVER } from "./constants";

const { EVENTS } = SOCKET_SERVER;

// Global map to store rooms
export const ROOMS = new Map<SocketServer, Room>();

let io: SocketServer | null = null;

export function initializeSocketServer(httpServer: HttpServer): SocketServer {
  if (io) {
    return io;
  }

  io = new SocketServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
    allowEIO3: true,
  });

  io.on(EVENTS.CONNECTION, (socket) => {
    console.log("CONNECTING TO SOCKET");

    socket.on("connect_error", (err: Error) => {
      console.log(`connect_error due to ${err.message}`);
    });

    console.log("*********CONNECTED TO SOCKET*********");

    // Create a new Room instance for this connection
    const newRoom = new Room(io!, socket);
    ROOMS.set(io!, newRoom);
  });

  console.log("Socket.IO server initialized");

  return io;
}

export function getSocketServer(): SocketServer | null {
  return io;
}
