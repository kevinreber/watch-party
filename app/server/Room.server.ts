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

interface VideoSyncEvent {
  roomId: string;
  type: "play" | "pause" | "seek";
  currentTime: number;
  timestamp: number;
}

interface VideoSyncState {
  isPlaying: boolean;
  currentTime: number;
}

// Store video sync state per room
const roomVideoStates = new Map<string, VideoSyncState>();

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
    socket.on("ROOM:user-join-room", (data: { username: string; roomId: string }) =>
      this.joinRoom(data)
    );
    socket.on("disconnect", () => this.disconnect());
    socket.on("MSG:user-is-typing", (data: unknown) => this.userIsTyping(data));
    socket.on("MSG:no-user-is-typing", () => this.noUserIsTyping());
    socket.on(EMITTER.SEND_MESSAGE, (message: Message) =>
      this.sendMessage(message)
    );

    // Video sync events
    socket.on("VIDEO:sync", (event: VideoSyncEvent) => this.handleVideoSync(event));
    socket.on("VIDEO:request-sync", (data: { roomId: string }) => this.handleSyncRequest(data));

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

  joinRoom(data: { username: string; roomId?: string }): void {
    console.log("****** JOINING ROOM ******");
    const socketId = this.socket.id;
    const { username, roomId } = data;

    // Store username and roomId in socket data
    this.socket.data.username = username;
    this.socket.data.roomId = roomId;

    // Join the room if roomId is provided
    if (roomId) {
      this.socket.join(roomId);
      this.roomName = roomId;
    }

    if (this.users.has(socketId)) {
      console.error(
        `Socket ID: "${socketId}" already exists in room "${this.roomName}"`
      );
    }

    // Add user to room
    this.users.set(socketId, username);

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

    // Broadcast join message to other users in the room
    if (roomId) {
      this.socket.to(roomId).emit("MSG:receive-message", message);

      // Send current video sync state to new user
      const syncState = roomVideoStates.get(roomId);
      if (syncState) {
        this.socket.emit("VIDEO:sync-state", syncState);
      }
    } else {
      this.socket.broadcast.emit("MSG:receive-message", message);
    }

    // Update room size for all users
    const userCount = this.getClientCount();
    if (roomId) {
      this.io.to(roomId).emit(LISTENER.UPDATE_USER_COUNT, userCount);
    } else {
      this.socket.broadcast.emit(LISTENER.UPDATE_USER_COUNT, userCount);
    }
  }

  disconnect(): void {
    console.log("DISCONNECTING-------------------");
    const socketId = this.socket.id;
    const roomId = this.socket.data.roomId;

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

      if (roomId) {
        this.socket.to(roomId).emit("MSG:receive-message", message);
      } else {
        this.socket.broadcast.emit("receive-message", message);
      }
    }

    // Update room size
    const userCount = this.getClientCount();
    if (roomId) {
      this.io.to(roomId).emit(LISTENER.UPDATE_USER_COUNT, userCount);
    } else {
      this.socket.broadcast.emit(LISTENER.UPDATE_USER_COUNT, userCount);
    }
  }

  // Handle video sync events (play, pause, seek)
  handleVideoSync(event: VideoSyncEvent): void {
    const { roomId, type, currentTime } = event;
    console.log(`Video sync event: ${type} at ${currentTime}s in room ${roomId}`);

    // Update room video state
    const currentState = roomVideoStates.get(roomId) || { isPlaying: false, currentTime: 0 };

    switch (type) {
      case "play":
        roomVideoStates.set(roomId, { isPlaying: true, currentTime });
        break;
      case "pause":
        roomVideoStates.set(roomId, { isPlaying: false, currentTime });
        break;
      case "seek":
        roomVideoStates.set(roomId, { ...currentState, currentTime });
        break;
    }

    // Broadcast to all other users in the room
    this.socket.to(roomId).emit("VIDEO:sync", event);
  }

  // Handle sync request from new users
  handleSyncRequest(data: { roomId: string }): void {
    const { roomId } = data;
    const syncState = roomVideoStates.get(roomId);

    if (syncState) {
      this.socket.emit("VIDEO:sync-state", syncState);
    }
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
    const roomId = this.socket.data.roomId;
    const message = `${username} is typing a message...`;

    if (roomId) {
      this.socket.to(roomId).emit("MSG:user-is-typing", message);
    } else {
      this.socket.broadcast.emit("MSG:user-is-typing", message);
    }
  }

  noUserIsTyping(): void {
    const roomId = this.socket.data.roomId;

    if (roomId) {
      this.socket.to(roomId).emit("MSG:no-user-is-typing");
    } else {
      this.socket.broadcast.emit("MSG:no-user-is-typing");
    }
  }
}
