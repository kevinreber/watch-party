// const uuidv4 = require("uuid").v4;

const messages = [];
const users = new Map();

const defaultUser = {
  id: "anon",
  name: "Anonymous",
};

const messageExpirationTimeMS = 5 * 60 * 1000;

export class SocketConnection {
  constructor(io, socket) {
    this.socket = socket;
    this.io = io;

    socket.on("getMessages", () => this.getMessages());
    socket.on("sendMessage", (value) => this.handleMessage(value));
    socket.on("disconnect", () => this.disconnect());
    socket.on("connect_error", (err) => {
      console.log(`connect_error due to ${err.message}`);
    });
  }

  sendMessage(message) {
    this.io.sockets.emit("sendMessage", message);
  }

  getMessages() {
    messages.forEach((message) => this.sendMessage(message));
  }

  handleMessage(value) {
    const message = {
      // id: uuidv4(),
      user: users.get(this.socket) || defaultUser,
      value,
      time: Date.now(),
    };

    messages.add(message);
    this.sendMessage(message);

    // setTimeout(() => {
    //   messages.delete(message);
    //   this.io.sockets.emit("deleteMessage", message.id);
    // }, messageExpirationTimeMS);
  }

  disconnect() {
    users.delete(this.socket);
  }
}

// console.log("CONNECTING TO SOCKET");
// // console.log(socket);
// console.log("*********CONNECTED TO SOCKET*********");

// const _id = socket.id;
// let ROOM;
// socket.on("join-room", (data) => {
//   const { username, room } = data;
//   console.log("JOINING ROOM ******");
//   console.log(data);
//   console.log(username, room);
//   socket.join(room);
//   console.log(`Socket ID:${_id}-"${username}" connected to: Room-${room}`);
//   if (!ROOMS.has(room)) {
//     ROOMS.set(room, new Room(room));
//   }
//   ROOM = ROOMS.get(room);
//   console.log(
//     `Socket ID:${_id}-"${username}" connected to: Room-${ROOM.name}`
//   );

//   // add new user to USERS set
//   USERS.set(_id, new User(_id, ROOM, username));
//   const USER = USERS.get(_id);
//   ROOM.join(_id);
//   // console.log(USERS, ROOM);

//   const content = `${USER.name} has joined the room`;
//   const message = {
//     type: "admin",
//     content,
//     created_at: new Date().getTime(),
//     username: "admin",
//   };

//   const videos = {
//     type: "get-current-video-list",
//     videos: ROOM.videos,
//   };

//   // socket.to(ROOM.name).emit(EMITTER.RECEIVE_MESSAGE, message);
//   socket.emit(`MSG:receive-message`, message);

//   console.log(message);
//   // get current videos list
//   io.to(_id).emit(LISTENER.UPDATE_VIDEO_LIST, videos);
//   // socket.to(_id).emit(LISTENER.UPDATE_VIDEO_LIST, videos);
//   // update room size
//   io.in(ROOM.name).emit(LISTENER.UPDATE_USER_COUNT, ROOM.users.size);
//   // socket.to(ROOM.name).emit(LISTENER.UPDATE_USER_COUNT, ROOM.users.size);
// });
// // Get the last 10 messages from the database.
// // Message.find()
// // 	.sort({ createdAt: -1 })
// // 	.limit(10)
// // 	.exec((err, messages) => {
// // 		if (err) return console.error(err);

// // 		// Send the last messages to the user.
// // 		socket.emit('init', messages);
// // 	});

// socket.on("user-update", (data) => {
//   console.log(data);
//   // needs to be io where we emit message to all users
//   socket.to(ROOM.name).broadcast.emit("user-updated", data);
// });

// socket.on("username-change", (user, username) => {
//   console.log(user, username);
//   // needs to be io where we emit message to all users
//   socket.to(ROOM.name).broadcast.emit("username-changed", user, username);
// });

// socket.on("event", (data) => {
//   // TODO: Need to store Player state and timestamps
//   //  data.state : 'play' | 'pause' | 'seek'
//   console.log(data.state, data);
//   // socket.broadcast.emit('receive-event', data);
//   socket.to(ROOM.name).broadcast.emit("receive-event", data);
// });

// socket.on(EMITTER.VIDEO_LIST_EVENT, (data) => {
//   // data.type : 'add-video' | 'remove-video'
//   console.log(data.type, data.video);

//   // TODO: Revisit "remove-video"
//   if (data.type === "add-video") ROOM.addVideo(data.video);
//   else if (data.type === "remove-video") ROOM.removeVideo(data.video);

//   data.videos = ROOM.videos;
//   // socket.broadcast.emit('update-video-list', data);
//   socket.to(ROOM.name).broadcast.emit("update-video-list", data);
// });

// // Listen to if a user is typing.
// // TODO: Handle if multiple users in a room are typing vs only two users in a room
// socket.on("typing", (data) => {
//   let message;
//   if (ROOM.users.size <= 2) {
//     message = `${data.username} `;
//   } else message = "Someone ";
//   message += "is typing a message...";
//   data.message = message;
//   socket.to(ROOM.name).broadcast.emit("typing", data);
// });

// // Listen to connected users for a new message.
// socket.on(EMITTER.SEND_MESSAGE, (msg) => {
//   console.log(msg);
//   ROOM.addMessage(msg);

//   // Create a message with the content and the name of the user.
//   // const message = new Message({
//   // 	content: msg.content,
//   // 	name: msg.name,
//   // });

//   // Save the message to the database.
//   // message.save((err) => {
//   // 	if (err) return console.error(err);
//   // });

//   // Notify all other users about a new message.
//   // socket.broadcast.emit('receive-message', msg);
//   socket.to(ROOM.name).broadcast.emit("receive-message", msg);
// });

// socket.on(EVENTS.DISCONNECT, () => {
//   const USER = USERS.get(_id);
//   // const ROOM = ROOMS.get(USER.room.name);
//   console.log("DISCONNECTING-------------------");
//   // To avoid edge case where all a user loses their websocket connection and
//   // tries to refresh their browser. Their socket will be undefined and not exist in USERS.
//   if (USER) {
//     const serverMsg = `SOCKET ID: ${_id}-${USER.name} disconnected from and Room: ${ROOM.name}`;
//     const content = `${USER.name} has left the room`;
//     const message = {
//       type: "admin",
//       content,
//       created_at: new Date().getTime(),
//       username: "admin",
//     };
//     console.log(serverMsg);
//     socket.to(ROOM.name).emit("receive-message", message);
//     USER.room.leave(_id);
//     socket.to(ROOM.name).emit("update-user-count", ROOM.users.size);
//   }
// });
