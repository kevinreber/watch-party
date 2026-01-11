import { getNowDateAsUTC } from "../utils/index.js";
import { SOCKET_SERVER } from "../constants.js";
const { EVENTS, EMITTER, LISTENER } = SOCKET_SERVER;

/**
 * Room is a collection of listening members; this becomes a "chat room"
 * where individual users can join/leave/broadcast to.
 *
 * Socket.io emit cheatsheet: https://socket.io/docs/v4/emit-cheatsheet/
 *
 * This class now supports optional MongoDB persistence for messages and room state.
 */

export class Room {
  /**
   * Create a new room instance
   * @param {Object} io - Socket.io server instance
   * @param {Object} socket - Socket.io client socket
   * @param {boolean} dbConnected - Whether database is connected
   * @param {Object} models - Mongoose models { Message, RoomModel }
   * @param {string} roomId - Room identifier
   * @param {boolean} privateRoom - Whether room is private
   */
  constructor(io, socket, dbConnected = false, models = {}, roomId = "TESTING", privateRoom = false) {
    this.io = io;
    this.socket = socket;
    this.dbConnected = dbConnected;
    this.models = models;
    this.roomName = roomId;
    this.private = privateRoom;
    this.users = new Map();
    this.videos = [];
    this.messages = [];
    this.currentRoomId = null;

    // Set up socket event listeners
    this._setupSocketListeners();
  }

  _setupSocketListeners() {
    this.socket.on("connect_error", (error) => {
      console.error(`connect_error due to ${error.message}`);
    });
  }

  getClientCount() {
    return this.io.engine.clientsCount;
  }

  /**
   * Send a message and optionally persist to database
   * @param {Object} message - Message object
   */
  async sendMessage(message) {
    console.log("Message received:", message.content?.substring(0, 50));
    this.addMessage(message);

    // Persist to database if connected
    if (this.dbConnected && this.models.Message && this.currentRoomId) {
      try {
        await this.models.Message.create({
          roomId: this.currentRoomId,
          type: message.type || "chat",
          content: message.content,
          username: message.username,
          userId: this.socket.id,
        });
      } catch (error) {
        console.error("Failed to persist message:", error.message);
      }
    }

    // Broadcast to other users
    this.socket.broadcast.emit("MSG:receive-message", message);
  }

  getUser(userId) {
    if (!this.users.has(userId)) {
      throw new Error(`${userId} not in room: ${this.roomName}`);
    }
    return this.users.get(userId);
  }

  toggleRoomPrivacy() {
    this.private = !this.private;
  }

  /**
   * Handle user joining a room
   * @param {Object} data - Join data containing username
   */
  async joinRoom(data) {
    console.log("****** JOINING ROOM ******");
    const socketId = this.socket.id;
    const { username, roomId } = data;

    this.currentRoomId = roomId || this.roomName;
    this.socket.data.username = username;

    if (this.users.has(socketId)) {
      console.error(
        `Socket ID: "${socketId}" already exists in room "${this.roomName}"`
      );
    }

    // Add user to room in database
    if (this.dbConnected && this.models.RoomModel && this.currentRoomId) {
      try {
        const room = await this.models.RoomModel.findOrCreateRoom(this.currentRoomId);
        await room.addUser(socketId, username);

        // Send existing videos to the new user
        if (room.videos && room.videos.length > 0) {
          this.socket.emit(LISTENER.UPDATE_VIDEO_LIST, {
            type: "sync-video-list",
            videos: room.videos,
          });
        }
      } catch (error) {
        console.error("Failed to add user to room:", error.message);
      }
    }

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
    console.log("CLIENT COUNT:", count);

    // Persist admin message
    if (this.dbConnected && this.models.Message && this.currentRoomId) {
      try {
        await this.models.Message.create({
          roomId: this.currentRoomId,
          type: "admin",
          content,
          username: "system",
          userId: socketId,
        });
      } catch (error) {
        console.error("Failed to persist join message:", error.message);
      }
    }

    this.socket.broadcast.emit("MSG:receive-message", message);

    const userCount = this.getClientCount();
    this.socket.broadcast.emit(LISTENER.UPDATE_USER_COUNT, userCount);
  }

  /**
   * Handle user disconnecting
   */
  async disconnect() {
    console.log("DISCONNECTING-------------------");
    const socketId = this.socket.id;

    // Remove user from database room
    if (this.dbConnected && this.models.RoomModel && this.currentRoomId) {
      try {
        const room = await this.models.RoomModel.findOne({ roomId: this.currentRoomId });
        if (room) {
          await room.removeUser(socketId);
        }
      } catch (error) {
        console.error("Failed to remove user from room:", error.message);
      }
    }

    if (this.users.has(socketId)) {
      const username = this.users.get(socketId);
      const nowDateUTC = getNowDateAsUTC();
      const content = `${username} has left the room`;
      const message = {
        type: "admin",
        content,
        created_at: nowDateUTC,
        username: "system",
      };

      console.log(`User ${username} disconnected from room ${this.currentRoomId}`);

      this.users.delete(socketId);
      this.socket.broadcast.emit("MSG:receive-message", message);
    }

    const userCount = this.getClientCount();
    this.socket.broadcast.emit(LISTENER.UPDATE_USER_COUNT, userCount);
  }

  /**
   * Add video to queue and persist to database
   * @param {Object} video - Video object
   */
  async addVideoToQueue(video) {
    this.videos.push(video);

    if (this.dbConnected && this.models.RoomModel && this.currentRoomId) {
      try {
        const room = await this.models.RoomModel.findOne({ roomId: this.currentRoomId });
        if (room) {
          await room.addVideo({
            ...video,
            addedBy: this.socket.data.username,
          });
        }
      } catch (error) {
        console.error("Failed to persist video:", error.message);
      }
    }

    const data = {
      type: "add-video",
      video,
      videos: this.videos,
    };
    this.socket.broadcast.emit("update-video-list", data);
  }

  /**
   * Remove video from queue and update database
   * @param {string} videoId - Video ID to remove
   */
  async removeVideoFromQueue(videoId) {
    this.videos = this.videos.filter((video) => video.videoId !== videoId);

    if (this.dbConnected && this.models.RoomModel && this.currentRoomId) {
      try {
        const room = await this.models.RoomModel.findOne({ roomId: this.currentRoomId });
        if (room) {
          await room.removeVideo(videoId);
        }
      } catch (error) {
        console.error("Failed to remove video:", error.message);
      }
    }

    const data = {
      type: "remove-video",
      videoId,
      videos: this.videos,
    };
    this.socket.broadcast.emit("update-video-list", data);
  }

  // Legacy methods for backward compatibility
  addVideo(video) {
    this.videos.push(video);
  }

  removeVideo(videoId) {
    this.videos = this.videos.filter((video) => video.videoId !== videoId);
  }

  addMessage(message) {
    this.messages.push(message);
  }

  removeMessage(messageId) {
    this.messages = this.messages.filter((message) => message.id !== messageId);
  }

  userIsTyping(data) {
    const { username } = this.socket.data;
    const message = `${username} is typing a message...`;
    this.socket.broadcast.emit("MSG:user-is-typing", message);
  }

  noUserIsTyping() {
    this.socket.broadcast.emit("MSG:no-user-is-typing");
  }
}
