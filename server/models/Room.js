// const mongoose = require('mongoose');
// const Schema = mongoose.Schema;
// const opts = require('./options');

// const roomSchema = new Schema(
// 	{
// 		name: {
// 			type: String,
// 			lowercase: true,
// 			required: [true, "can't be blank"],
// 			match: [/^[a-zA-Z0-9]+$/, 'is invalid'],
// 			index: true,
// 		},
// 		owner_id: {
// 			type: mongoose.Schema.Types.ObjectId,
// 			ref: 'User',
// 		},
// 		admins: [{ type: String, ref: 'User' }],
// 		users: [{ type: String, ref: 'User' }],
// 		messages: [
// 			{
// 				content: { type: String, required: true },
// 				username: { type: String, required: true },
// 				user_id: {
// 					type: mongoose.Schema.Types.ObjectId,
// 					ref: 'User',
// 					required: true,
// 				},
// 				created_at: { type: String, required: true },
// 			},
// 		],
// 	},
// 	opts
// );

// const Room = mongoose.model('Room', roomSchema);
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
 */

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
    socket.on("ROOM:user-join-room", (data) => this.joinRoom(socket, data));
    socket.on("disconnect", () => this.disconnect(socket));
    socket.on("MSG:user-is-typing", (data) => this.userIsTyping(data));
    socket.on("MSG:no-user-is-typing", () => this.noUserIsTyping());
    socket.on(EMITTER.SEND_MESSAGE, (message) =>
      this.sendMessage(message, socket)
    );
    socket.on("connect_error", (error) => {
      console.error(`connect_error due to ${error.message}`);
    });
    // });
  }

  sendMessage(message, socket) {
    {
      console.log(message);
      this.addMessage(message);

      // Notify all other users about a new message.
      // socket.broadcast.emit('receive-message', msg);
      // socket.to(this.roomId).broadcast.emit("receive-message", message);
      socket.emit(`MSG:receive-message`, message);
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
  joinRoom(socket, data) {
    console.log("****** JOINING ROOM ******");
    const socketId = socket.id;
    const { username } = data;

    if (this.users.has(socketId)) {
      console.error(
        `Socket ID: "${socketId}" already exists in room "${this.roomName}"`
      );
    }

    // Add user to `users` Map
    this.users.set(socketId, username);

    const nowDateUTC = getNowDateAsUTC();
    const content = `${username} has joined the room`;
    const message = {
      type: "admin",
      content,
      created_at: nowDateUTC,
      userId: socketId,
      username,
    };

    const videos = {
      type: "get-current-video-list",
      videos: this.videos,
    };

    socket.emit(`MSG:receive-message`, message);

    // get current videos list
    // io.to(socketId).emit(LISTENER.UPDATE_VIDEO_LIST, videos);
    socket.emit(LISTENER.UPDATE_VIDEO_LIST, videos);

    // update room size
    // io.in(this.roomId).emit(LISTENER.UPDATE_USER_COUNT, this.users.size);
    socket.emit(LISTENER.UPDATE_USER_COUNT, this.users.size);
  }

  /** user leaving a room. */
  disconnect(socket) {
    console.log("DISCONNECTING-------------------");
    const socketId = socket.id;
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
      socket.to(this.roomId).emit("receive-message", message);
    }
    // update room size
    // io.in(this.roomId).emit(LISTENER.UPDATE_USER_COUNT, this.users.size);
    socket.emit(LISTENER.UPDATE_USER_COUNT, this.users.size);
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
    const message = `${data.username} is typing a message...`;

    data.message = message;
    // socket.to(this.roomId).broadcast.emit("typing", data);
    socket.emit("MSG:user-is-typing", data);
  }

  noUserIsTyping() {
    // socket.to(this.roomId).broadcast.emit("typing", data);
    socket.emit("MSG:no-user-is-typing", data);
  }
}
