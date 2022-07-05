/** app for watch party */

const config = require("./config");
const express = require("express");
const app = express();
const server = require("http").Server(app);
const cors = require("cors");
const io = require("socket.io")(server);

const { searchYoutube } = require("./utils/youtube");

// mongo/mongoose
const Message = require("./models/Message");
const { Room, ROOMS } = require("./models/Room");
const { User, USERS } = require("./models/User");
const mongoose = require("mongoose");

mongoose
  .connect(config.DB_URI, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => console.log("SUCCESS - Connected to DB"))
  .catch((err) => console.error("ERROR connecting to DB:", err));

app.use(express.json());
app.use(cors());

app.get("/login", async (req, res) => {
  console.log("logging in");
});

app.get("/api/youtube", async (req, res) => {
  console.log(req.query);
  if (typeof req.query.q === "string") {
    try {
      const items = await searchYoutube(req.query.q);
      res.json(items);
    } catch (err) {
      console.log("ERRRRRRRROOOOOOOORRRR-----------------------");
      console.log(err);
      console.log("ERRRRRRRROOOOOOOORRRR-----------------------");
      console.log("ERRRRRRRROOOOOOOORRRR-----------------------");

      return res.status(500).json({ error: "youtube error" });
    }
  } else {
    return res.status(500).json({ error: "query must be a string" });
  }
});

io.on("connection", (socket) => {
  const _id = socket.id;
  let ROOM;
  socket.on("join-room", (username, room) => {
    socket.join(room);
    console.log(`Socket ID:${_id}-"${username}" connected to: Room-${room}`);
    if (!ROOMS.has(room)) {
      ROOMS.set(room, new Room(room));
    }
    ROOM = ROOMS.get(room);

    // add new user to USERS set
    USERS.set(_id, new User(_id, ROOM, username));
    const USER = USERS.get(_id);
    ROOM.join(_id);

    const content = `${USER.name} has joined the room`;
    const message = {
      type: "admin",
      content,
      created_at: new Date().getTime(),
      username: "admin",
    };

    const videos = {
      type: "get-current-video-list",
      videos: ROOM.videos,
    };

    socket.to(ROOM.name).emit("receive-message", message);
    // get current videos list
    io.to(_id).emit("update-video-list", videos);
    // update room size
    io.in(ROOM.name).emit("update-user-count", ROOM.users.size);
  });
  // Get the last 10 messages from the database.
  // Message.find()
  // 	.sort({ createdAt: -1 })
  // 	.limit(10)
  // 	.exec((err, messages) => {
  // 		if (err) return console.error(err);

  // 		// Send the last messages to the user.
  // 		socket.emit('init', messages);
  // 	});

  socket.on("user-update", (data) => {
    console.log(data);
    // needs to be io where we emit message to all users
    socket.to(ROOM.name).broadcast.emit("user-updated", data);
  });

  socket.on("username-change", (user, username) => {
    console.log(user, username);
    // needs to be io where we emit message to all users
    socket.to(ROOM.name).broadcast.emit("username-changed", user, username);
  });

  socket.on("event", (data) => {
    // TODO: Need to store Player state and timestamps
    //  data.state : 'play' | 'pause' | 'seek'
    console.log(data.state, data);
    // socket.broadcast.emit('receive-event', data);
    socket.to(ROOM.name).broadcast.emit("receive-event", data);
  });

  socket.on("video-list-event", (data) => {
    // data.type : 'add-video' | 'remove-video'
    console.log(data.type, data.video);

    // TODO: Revisit "remove-video"
    if (data.type === "add-video") ROOM.addVideo(data.video);
    else if (data.type === "remove-video") ROOM.removeVideo(data.video);

    data.videos = ROOM.videos;
    // socket.broadcast.emit('update-video-list', data);
    socket.to(ROOM.name).broadcast.emit("update-video-list", data);
  });

  // Listen to if a user is typing.
  // TODO: Handle if multiple users in a room are typing vs only two users in a room
  socket.on("typing", (data) => {
    let message;
    if (ROOM.users.size <= 2) {
      message = `${data.username} `;
    } else message = "Someone ";
    message += "is typing a message...";
    data.message = message;
    socket.to(ROOM.name).broadcast.emit("typing", data);
  });

  // Listen to connected users for a new message.
  socket.on("send-message", (msg) => {
    console.log(msg);
    ROOM.addMessage(msg);

    // Create a message with the content and the name of the user.
    // const message = new Message({
    // 	content: msg.content,
    // 	name: msg.name,
    // });

    // Save the message to the database.
    // message.save((err) => {
    // 	if (err) return console.error(err);
    // });

    // Notify all other users about a new message.
    // socket.broadcast.emit('receive-message', msg);
    socket.to(ROOM.name).broadcast.emit("receive-message", msg);
  });

  socket.on("disconnect", () => {
    const USER = USERS.get(_id);
    // const ROOM = ROOMS.get(USER.room.name);
    console.log("DISCONNECTING-------------------");
    // To avoid edge case where all a user loses their websocket connection and
    // tries to refresh their browser. Their socket will be undefined and not exist in USERS.
    if (USER) {
      const serverMsg = `SOCKET ID: ${_id}-${USER.name} disconnected from and Room: ${ROOM.name}`;
      const content = `${USER.name} has left the room`;
      const message = {
        type: "admin",
        content,
        created_at: new Date().getTime(),
        username: "admin",
      };
      console.log(serverMsg);
      socket.to(ROOM.name).emit("receive-message", message);
      USER.room.leave(_id);
      socket.to(ROOM.name).emit("update-user-count", ROOM.users.size);
    }
  });
});

module.exports = server;
