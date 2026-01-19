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
  videoId: Video | null;
  videos: Video[];
  lastUpdated: number;
}

// Store video sync state per room
const roomVideoStates = new Map<string, VideoSyncState>();

// Get or create video state for a room
function getVideoState(roomId: string): VideoSyncState {
  if (!roomVideoStates.has(roomId)) {
    roomVideoStates.set(roomId, {
      isPlaying: false,
      currentTime: 0,
      videoId: null,
      videos: [],
      lastUpdated: Date.now(),
    });
  }
  return roomVideoStates.get(roomId)!;
}

// Update video state for a room
function updateVideoState(roomId: string, updates: Partial<VideoSyncState>): VideoSyncState {
  const state = getVideoState(roomId);
  Object.assign(state, updates, { lastUpdated: Date.now() });
  return state;
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

    // Video list events (for backward compatibility with old client)
    socket.on("event", (data: any, roomId: string) => this.handleLegacyVideoEvent(data, roomId));
    socket.on("request-video-state", (roomId: string) => this.handleLegacySyncRequest(roomId));
    socket.on("video_list_event", (data: any) => this.handleVideoListEvent(data));

    socket.on("connect_error", (error: Error) => {
      console.error(`connect_error due to ${error.message}`);
    });
  }

  getClientCount(): number {
    return this.io.engine.clientsCount;
  }

  // Get the number of users in a specific room
  getRoomUserCount(roomId: string): number {
    const room = this.io.sockets.adapter.rooms.get(roomId);
    return room ? room.size : 0;
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

    // Broadcast join message to other users in the room
    if (roomId) {
      this.socket.to(roomId).emit("MSG:receive-message", message);

      // Send current video sync state to new user
      const state = getVideoState(roomId);
      // Calculate elapsed time if video is playing
      const stateToSend = { ...state };
      if (state.isPlaying && state.lastUpdated) {
        const elapsedSeconds = (Date.now() - state.lastUpdated) / 1000;
        stateToSend.currentTime = state.currentTime + elapsedSeconds;
      }
      console.log(`Sending video state to new user joining room ${roomId}:`, stateToSend);
      this.socket.emit("VIDEO:sync-state", stateToSend);
      // Also send legacy format for backward compatibility
      this.socket.emit("video-state-sync", stateToSend);

      // Update room size for all users in this room
      const roomUserCount = this.getRoomUserCount(roomId);
      console.log(`Room ${roomId} user count:`, roomUserCount);
      this.io.to(roomId).emit(LISTENER.UPDATE_USER_COUNT, roomUserCount);
    } else {
      this.socket.broadcast.emit("MSG:receive-message", message);
      // Fallback to global count if no roomId
      const userCount = this.getClientCount();
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

    // Update room size for remaining users
    if (roomId) {
      const roomUserCount = this.getRoomUserCount(roomId);
      console.log(`Room ${roomId} user count after disconnect:`, roomUserCount);
      this.io.to(roomId).emit(LISTENER.UPDATE_USER_COUNT, roomUserCount);
    } else {
      const userCount = this.getClientCount();
      this.socket.broadcast.emit(LISTENER.UPDATE_USER_COUNT, userCount);
    }
  }

  // Handle video sync events (play, pause, seek)
  handleVideoSync(event: VideoSyncEvent): void {
    const { roomId, type, currentTime } = event;
    console.log(`Video sync event: ${type} at ${currentTime}s in room ${roomId}`);

    // Update room video state using helper function
    switch (type) {
      case "play":
        updateVideoState(roomId, { isPlaying: true, currentTime });
        break;
      case "pause":
        updateVideoState(roomId, { isPlaying: false, currentTime });
        break;
      case "seek":
        updateVideoState(roomId, { currentTime });
        break;
    }

    // Broadcast to all other users in the room
    this.socket.to(roomId).emit("VIDEO:sync", event);
  }

  // Handle sync request from new users
  handleSyncRequest(data: { roomId: string }): void {
    const { roomId } = data;
    const state = getVideoState(roomId);

    // Calculate elapsed time if video is playing
    const stateToSend = { ...state };
    if (state.isPlaying && state.lastUpdated) {
      const elapsedSeconds = (Date.now() - state.lastUpdated) / 1000;
      stateToSend.currentTime = state.currentTime + elapsedSeconds;
    }

    console.log(`Sending video state to user in room ${roomId}:`, stateToSend);
    this.socket.emit("VIDEO:sync-state", stateToSend);
  }

  // Handle legacy video events (for backward compatibility)
  handleLegacyVideoEvent(data: any, roomId: string): void {
    const { state } = data;
    console.log(`Legacy video sync event: ${state} at ${data.currentTime || data.newTime || 0}s in room ${roomId}`);

    // Update shared video state based on event type
    if (state === "load-video") {
      updateVideoState(roomId, {
        videoId: data.videoId,
        currentTime: 0,
        isPlaying: false,
      });
    } else if (state === "play") {
      updateVideoState(roomId, {
        currentTime: data.currentTime,
        isPlaying: true,
      });
    } else if (state === "pause") {
      updateVideoState(roomId, {
        currentTime: data.currentTime,
        isPlaying: false,
      });
    } else if (state === "seek") {
      updateVideoState(roomId, {
        currentTime: data.newTime,
      });
    }

    // Broadcast event to all other users in the room
    this.socket.broadcast.emit("receive-event", data);
  }

  // Handle legacy sync request
  handleLegacySyncRequest(roomId: string): void {
    const state = getVideoState(roomId);

    // Calculate elapsed time if video is playing
    const stateToSend = { ...state };
    if (state.isPlaying && state.lastUpdated) {
      const elapsedSeconds = (Date.now() - state.lastUpdated) / 1000;
      stateToSend.currentTime = state.currentTime + elapsedSeconds;
    }

    console.log(`Sending legacy video state to user in room ${roomId}:`, stateToSend);
    this.socket.emit("video-state-sync", stateToSend);
  }

  // Handle video list events (add/remove videos)
  handleVideoListEvent(data: any): void {
    const { type, video, roomId } = data;
    console.log(`Video list event: ${type}`, video);

    const actualRoomId = roomId || this.socket.data.roomId || "default";
    const videoState = getVideoState(actualRoomId);

    if (type === "add-video") {
      videoState.videos.push(video);
      // If this is the first video, set it as current
      if (videoState.videos.length === 1) {
        videoState.videoId = video;
      }
    } else if (type === "remove-video") {
      videoState.videos = videoState.videos.filter((v) => v.videoId !== video.videoId);
    }

    // Broadcast updated video list to all other users
    const responseData = {
      type,
      video,
      videos: videoState.videos,
    };

    if (actualRoomId && actualRoomId !== "default") {
      this.socket.to(actualRoomId).emit("update_video_list", responseData);
    } else {
      this.socket.broadcast.emit("update_video_list", responseData);
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
