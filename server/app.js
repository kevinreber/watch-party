/** app for watch party */
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import { searchYoutube } from "./utils/index.js";
import { SOCKET_SERVER } from "./constants.js";
import { Room } from "./models/Room.js";
// import { SocketConnection } from "./models/SocketConnection.js";

const app = express();

export const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    transports: ["websocket", "polling"],
    credentials: true,
  },
  allowEIO3: true,
});

const { EVENTS, EMITTER, LISTENER } = SOCKET_SERVER;

export const ROOMS = new Map();

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
    } catch (error) {
      console.log("ERRRRRRRROOOOOOOORRRR-----------------------");
      console.error(error);
      console.log("ERRRRRRRROOOOOOOORRRR-----------------------");

      return res.status(500).json({ error: "youtube error" });
    }
  } else {
    return res.status(500).json({ error: "query must be a string" });
  }
});

app.get("/getRoomData", async (req, res) => {
  if (typeof req.query.roomId === "string") {
    const { roomId } = req.query;

    if (!ROOMS.has(roomId)) {
      ROOMS.set(roomId, new Room(roomId));
    }

    // const room = ROOMS.get(roomId);
    return res
      .status(200)
      .json({ message: `Successfuly joined room ${roomId}` });
  } else {
    return res.status(500).json({ error: "query must be a string" });
  }
});

io.on(EVENTS.CONNECTION, (socket) => {
  console.log("CONNECTING TO SOCKET");
  socket.on("connect_error", (err) => {
    console.log(`connect_error due to ${err.message}`);
  });
  // console.log(socket);

  console.log("*********CONNECTED TO SOCKET*********");

  // new SocketConnection(io, socket);
  const newRoom = new Room(io, socket);
  ROOMS.set(io, newRoom);

  /**
   * ! TODO: Move too `Room` class
  // if (!ROOMS.has(roomId)) {
  //   ROOMS.set(roomId, new Room(roomId));
  // }
  const _id = socket.id;
  let ROOM;

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

    socket.on(EMITTER.VIDEO_LIST_EVENT, (data) => {
      // data.type : 'add-video' | 'remove-video'
      console.log(data.type, data.video);

      // TODO: Revisit "remove-video"
      if (data.type === "add-video") ROOM.addVideo(data.video);
      else if (data.type === "remove-video") ROOM.removeVideo(data.video);

      data.videos = ROOM.videos;
      // socket.broadcast.emit('update-video-list', data);
      socket.to(ROOM.name).broadcast.emit("update-video-list", data);
    });
    */
});
