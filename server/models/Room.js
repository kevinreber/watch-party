import { getNowDateAsUTC } from "../utils/index.js";
import { SOCKET_SERVER } from "../constants.js";
const { EVENTS, EMITTER, LISTENER } = SOCKET_SERVER;

/* Separate socket listeners/emitters to
- Player Commands
- Videos
- Messages
- Room
*/

/**
 * Room is a collection of listening members; this becomes a "chat room"
 * where individual users can join/leave/broadcast to.
 *
 * Socket.io emit cheetsheet: https://socket.io/docs/v4/emit-cheatsheet/
 *
 * This file was created based off a similar pattern shown here:
 * https://developer.okta.com/blog/2021/07/14/socket-io-react-tutorial
 */

// Shared video state across all rooms (keyed by roomId)
const roomVideoStates = new Map();

export class Room {
  /** make a new room, starting with empty set of listeners */
  constructor(io, socket, roomId = "TESTING", privateRoom = false) {
    this.io = io;
    this.socket = socket;
    this.roomName = roomId;
    this.private = privateRoom;
    this.users = new Map();
    this.videos = [];
    this.messages = [];

    // io.of(this.roomName).on(EVENTS.CONNECTION, (socket) => {
    socket.on("ROOM:user-join-room", (data) => this.joinRoom(data));
    socket.on("disconnect", () => this.disconnect());
    socket.on("MSG:user-is-typing", (data) => this.userIsTyping(data));
    socket.on("MSG:no-user-is-typing", () => this.noUserIsTyping());
    socket.on(EMITTER.SEND_MESSAGE, (message) => this.sendMessage(message));
    socket.on("event", (data, roomId) => this.handleVideoEvent(data, roomId));
    socket.on("request-video-state", (roomId) => this.sendVideoState(roomId));
    socket.on(EMITTER.VIDEO_LIST_EVENT, (data) => this.handleVideoListEvent(data));
    socket.on("connect_error", (error) => {
      console.error(`connect_error due to ${error.message}`);
    });
    // });
  }

  /**
   * Get or create video state for a room
   */
  static getVideoState(roomId) {
    if (!roomVideoStates.has(roomId)) {
      roomVideoStates.set(roomId, {
        videoId: null,
        currentTime: 0,
        isPlaying: false,
        lastUpdated: Date.now(),
        videos: [],
      });
    }
    return roomVideoStates.get(roomId);
  }

  /**
   * Update video state for a room
   */
  static updateVideoState(roomId, updates) {
    const state = Room.getVideoState(roomId);
    Object.assign(state, updates, { lastUpdated: Date.now() });
    return state;
  }

  /**
   * Handle video sync events (play, pause, seek, load-video)
   */
  handleVideoEvent(data, roomId) {
    const { state } = data;
    console.log(`Video sync event: ${state} at ${data.currentTime || data.newTime || 0}s in room ${roomId}`);

    // Update shared video state based on event type
    if (state === "load-video") {
      Room.updateVideoState(roomId, {
        videoId: data.videoId,
        currentTime: 0,
        isPlaying: false,
      });
    } else if (state === "play") {
      Room.updateVideoState(roomId, {
        currentTime: data.currentTime,
        isPlaying: true,
      });
    } else if (state === "pause") {
      Room.updateVideoState(roomId, {
        currentTime: data.currentTime,
        isPlaying: false,
      });
    } else if (state === "seek") {
      Room.updateVideoState(roomId, {
        currentTime: data.newTime,
      });
    }

    // Broadcast event to all other users in the room
    this.socket.broadcast.emit("receive-event", data);
  }

  /**
   * Send current video state to requesting client
   */
  sendVideoState(roomId) {
    const videoState = Room.getVideoState(roomId);

    // Create a copy to avoid mutating the stored state
    const stateToSend = { ...videoState };

    // Calculate estimated current time if video is playing
    if (stateToSend.isPlaying && stateToSend.lastUpdated) {
      const elapsedSeconds = (Date.now() - stateToSend.lastUpdated) / 1000;
      stateToSend.currentTime = stateToSend.currentTime + elapsedSeconds;
    }

    console.log(`Sending video state to new user in room ${roomId}:`, stateToSend);
    this.socket.emit("video-state-sync", stateToSend);
  }

  /**
   * Handle video list events (add/remove videos)
   */
  handleVideoListEvent(data) {
    const { type, video, roomId } = data;
    console.log(`Video list event: ${type}`, video);

    const videoState = Room.getVideoState(roomId || "default");

    if (type === "add-video") {
      videoState.videos.push(video);
      // If this is the first video, set it as current
      if (videoState.videos.length === 1) {
        videoState.videoId = video;
      }
    } else if (type === "remove-video") {
      videoState.videos = videoState.videos.filter((v) => v !== video);
    }

    // Broadcast updated video list to all other users
    const responseData = {
      type,
      video,
      videos: videoState.videos,
    };
    this.socket.broadcast.emit("update_video_list", responseData);
  }

  getClientCount() {
    return this.io.engine.clientsCount;
  }

  sendMessage(message) {
    {
      console.log(message);
      this.addMessage(message);

      // Notify all other users about a new message.
      // socket.to(this.roomId).broadcast.emit("receive-message", message);
      this.socket.broadcast.emit(`MSG:receive-message`, message);
    }
  }

  getUser(userId) {
    if (!this.users.has(userId)) {
      throw new Error(`${userId} not in room: ${this.roomName}`);
    }

    return this.users.get(userId);
  }

  /** toggle privacy of room. */
  toggleRoomPrivacy() {
    this.private = !this.private;
  }

  /** user joining a room. */
  joinRoom(data) {
    console.log("****** JOINING ROOM ******");
    const socketId = this.socket.id;
    const { username } = data;

    // https://socket.io/docs/v4/server-socket-instance/#socketdata
    this.socket.data.username = username;

    if (this.users.has(socketId)) {
      console.error(
        `Socket ID: "${socketId}" already exists in room "${this.roomName}"`
      );
    }

    // Add user to `users` Map
    // this.users.set(socketId, username);

    const nowDateUTC = getNowDateAsUTC();
    const content = `${username} has joined the room`;
    const message = {
      type: "admin",
      content,
      created_at: nowDateUTC,
      userId: socketId,
      username,
    };

    const count = this.io.engine.clientsCount;
    console.log("CLIENT COUNT ", count);

    // TODO
    // const videos = {
    //   type: "get-current-video-list",
    //   videos: this.videos,
    // };

    // this.io.sockets.emit(`MSG:receive-message`, message); <----- This also works
    this.socket.broadcast.emit(`MSG:receive-message`, message);

    // get current videos list
    // io.to(socketId).emit(LISTENER.UPDATE_VIDEO_LIST, videos);
    // TODO
    // this.socket.emit(LISTENER.UPDATE_VIDEO_LIST, videos);

    // update room size
    // io.in(this.roomId).emit(LISTENER.UPDATE_USER_COUNT, this.users.size);
    // TODO
    const userCount = this.getClientCount();
    this.socket.broadcast.emit(LISTENER.UPDATE_USER_COUNT, userCount);
  }

  /** user leaving a room. */
  disconnect() {
    console.log("DISCONNECTING-------------------");
    const socketId = this.socket.id;
    // To avoid edge case where all a user loses their websocket connection and
    // tries to refresh their browser. Their socket will be undefined and not exist in USERS.
    if (this.users.has(socketId)) {
      const username = this.users.get(socketId);
      const serverMsg = `SOCKET ID: ${socket}-${username} disconnected from and Room: ${this.roomId}`;
      const nowDateUTC = getNowDateAsUTC();
      const content = `${username} has left the room`;
      const message = {
        type: "admin",
        content,
        created_at: nowDateUTC,
        username: "admin",
      };

      console.log(serverMsg);

      this.users.delete(socketId);
      // this.socket.to(this.roomId).emit("receive-message", message);
      this.socket.broadcast.emit("receive-message", message);
    }
    // update room size
    // io.in(this.roomId).emit(LISTENER.UPDATE_USER_COUNT, this.users.size);
    const userCount = this.getClientCount();
    this.socket.broadcast.emit(LISTENER.UPDATE_USER_COUNT, userCount);
  }

  /** add video to videos list. */
  addVideo(video) {
    this.videos.push(video);
  }

  /** remove video from videos list. */
  removeVideo(videoId) {
    const filteredVideos = this.videos.filter((video) => video !== videoId);
    this.videos = filteredVideos;
  }

  /** add message to messages list. */
  addMessage(message) {
    this.messages.push(message);
  }

  /** remove message from messages list. */
  removeMessage(messageId) {
    const filteredMessages = this.messages.filter(
      (message) => message.id !== messageId
    );
    this.messages = filteredMessages;
  }

  userIsTyping(data) {
    // TODO: Handle if multiple users in a room are typing vs only two users in a room
    const { username } = this.socket.data;
    const message = `${username} is typing a message...`;

    this.socket.broadcast.emit("MSG:user-is-typing", message);
  }

  noUserIsTyping() {
    // socket.to(this.roomId).broadcast.emit("typing", data);
    this.socket.broadcast.emit("MSG:no-user-is-typing");
  }
}
