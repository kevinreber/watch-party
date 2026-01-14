import type { Server, Socket } from "socket.io";
import { getNowDateAsUTC } from "./date.server";
import { SOCKET_SERVER } from "./constants";

const { EVENTS, EMITTER, LISTENER } = SOCKET_SERVER;

interface Message {
  type: string;
  content: string;
  created_at: string;
  userId?: string;
  username: string;
}

interface Video {
  videoId: string;
  url: string;
  name: string;
  channel?: string;
  description?: string;
  img?: string;
}

/**
 * Room is a collection of listening members; this becomes a "chat room"
 * where individual users can join/leave/broadcast to.
 *
 * Socket.io emit cheatsheet: https://socket.io/docs/v4/emit-cheatsheet/
 */
export class Room {
  io: Server;
  socket: Socket;
  roomName: string;
  private: boolean;
  users: Map<string, string>;
  videos: Video[];
  messages: Message[];

  constructor(io: Server, socket: Socket, roomId = "TESTING", privateRoom = false) {
    this.io = io;
    this.socket = socket;
    this.roomName = roomId;
    this.private = privateRoom;
    this.users = new Map();
    this.videos = [];
    this.messages = [];

    // Set up socket event listeners
    socket.on("ROOM:user-join-room", (data: { username: string }) =>
      this.joinRoom(data)
    );
    socket.on("disconnect", () => this.disconnect());
    socket.on("MSG:user-is-typing", (data: unknown) => this.userIsTyping(data));
    socket.on("MSG:no-user-is-typing", () => this.noUserIsTyping());
    socket.on(EMITTER.SEND_MESSAGE, (message: Message) =>
      this.sendMessage(message)
    );
    socket.on("connect_error", (error: Error) => {
      console.error(`connect_error due to ${error.message}`);
    });
  }

  getClientCount(): number {
    return this.io.engine.clientsCount;
  }

  sendMessage(message: Message): void {
    console.log("Message received:", message);
    this.addMessage(message);
    // Notify all other users about a new message
    this.socket.broadcast.emit("MSG:receive-message", message);
  }

  getUser(userId: string): string {
    if (!this.users.has(userId)) {
      throw new Error(`${userId} not in room: ${this.roomName}`);
    }
    return this.users.get(userId)!;
  }

  toggleRoomPrivacy(): void {
    this.private = !this.private;
  }

  joinRoom(data: { username: string }): void {
    console.log("****** JOINING ROOM ******");
    const socketId = this.socket.id;
    const { username } = data;

    // Store username in socket data
    this.socket.data.username = username;

    if (this.users.has(socketId)) {
      console.error(
        `Socket ID: "${socketId}" already exists in room "${this.roomName}"`
      );
    }

    const nowDateUTC = getNowDateAsUTC();
    const content = `${username} has joined the room`;
    const message: Message = {
      type: "admin",
      content,
      created_at: nowDateUTC,
      userId: socketId,
      username,
    };

    const count = this.io.engine.clientsCount;
    console.log("CLIENT COUNT", count);

    // Broadcast join message to other users
    this.socket.broadcast.emit("MSG:receive-message", message);

    // Update room size for all users
    const userCount = this.getClientCount();
    this.socket.broadcast.emit(LISTENER.UPDATE_USER_COUNT, userCount);
  }

  disconnect(): void {
    console.log("DISCONNECTING-------------------");
    const socketId = this.socket.id;

    if (this.users.has(socketId)) {
      const username = this.users.get(socketId);
      const nowDateUTC = getNowDateAsUTC();
      const content = `${username} has left the room`;
      const message: Message = {
        type: "admin",
        content,
        created_at: nowDateUTC,
        username: "admin",
      };

      console.log(
        `SOCKET ID: ${socketId}-${username} disconnected from Room: ${this.roomName}`
      );

      this.users.delete(socketId);
      this.socket.broadcast.emit("receive-message", message);
    }

    // Update room size
    const userCount = this.getClientCount();
    this.socket.broadcast.emit(LISTENER.UPDATE_USER_COUNT, userCount);
  }

  addVideo(video: Video): void {
    this.videos.push(video);
  }

  removeVideo(videoId: string): void {
    this.videos = this.videos.filter((video) => video.videoId !== videoId);
  }

  addMessage(message: Message): void {
    this.messages.push(message);
  }

  removeMessage(messageId: string): void {
    this.messages = this.messages.filter(
      (message) => (message as any).id !== messageId
    );
  }

  userIsTyping(_data: unknown): void {
    const username = this.socket.data.username;
    const message = `${username} is typing a message...`;
    this.socket.broadcast.emit("MSG:user-is-typing", message);
  }

  noUserIsTyping(): void {
    this.socket.broadcast.emit("MSG:no-user-is-typing");
  }
}
