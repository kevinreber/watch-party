/** app for watch party */
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import { searchYoutube } from "./utils/index.js";
import { SOCKET_SERVER } from "./constants.js";
import { Room } from "./models/Room.js";
import { Message, RoomModel } from "./models/schemas/index.js";
import connectDB from "./db.js";
import config from "./config.js";
import {
  validateYoutubeQuery,
  validateRoomId,
  validateMessage,
  validateUsername,
  validateVideo,
  sanitizeString,
} from "./middleware/validation.js";

const app = express();

export const httpServer = createServer(app);

// Configure CORS with specific origins
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.) in development
    if (!origin && config.NODE_ENV === "development") {
      return callback(null, true);
    }

    if (!origin || config.ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
};

const io = new Server(httpServer, {
  cors: corsOptions,
  allowEIO3: true,
  transports: ["websocket", "polling"],
});

const { EVENTS, EMITTER, LISTENER } = SOCKET_SERVER;

export const ROOMS = new Map();

// Initialize MongoDB connection
let dbConnected = false;
connectDB()
  .then((conn) => {
    if (conn) {
      dbConnected = true;
      console.log("Database connected successfully");
    }
  })
  .catch((err) => {
    console.error("Database connection failed:", err.message);
  });

app.use(express.json());
app.use(cors(corsOptions));

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    database: dbConnected ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
  });
});

// Login endpoint (placeholder for future auth implementation)
app.get("/login", async (req, res) => {
  res.json({ message: "Login endpoint - authentication not yet implemented" });
});

// YouTube search endpoint with validation
app.get("/api/youtube", validateYoutubeQuery, async (req, res) => {
  try {
    const items = await searchYoutube(req.query.q);
    res.json(items);
  } catch (error) {
    console.error("YouTube API Error:", error.message);
    return res.status(500).json({
      error: "YouTube API error",
      message:
        config.NODE_ENV === "development"
          ? error.message
          : "Failed to search YouTube",
    });
  }
});

// Get room data endpoint with validation
app.get("/getRoomData", validateRoomId, async (req, res) => {
  const { roomId } = req.query;

  try {
    if (!ROOMS.has(roomId)) {
      ROOMS.set(roomId, new Room(roomId));
    }

    // If database is connected, fetch or create room in DB
    let roomData = null;
    if (dbConnected) {
      roomData = await RoomModel.findOrCreateRoom(roomId);
    }

    return res.status(200).json({
      message: `Successfully joined room ${roomId}`,
      room: roomData
        ? {
            roomId: roomData.roomId,
            videos: roomData.videos,
            activeUsers: roomData.activeUsers.length,
          }
        : null,
    });
  } catch (error) {
    console.error("Get room error:", error.message);
    return res.status(500).json({
      error: "Server error",
      message: "Failed to get room data",
    });
  }
});

// Get room messages endpoint
app.get("/api/rooms/:roomId/messages", async (req, res) => {
  const { roomId } = req.params;

  // Validate roomId
  const roomIdPattern = /^[a-zA-Z0-9_-]{1,50}$/;
  if (!roomIdPattern.test(roomId)) {
    return res.status(400).json({
      error: "Invalid roomId format",
    });
  }

  try {
    if (!dbConnected) {
      return res.json({ messages: [], notice: "Database not connected" });
    }

    const messages = await Message.getRecentMessages(roomId, 50);
    return res.json({ messages: messages.reverse() });
  } catch (error) {
    console.error("Get messages error:", error.message);
    return res.status(500).json({
      error: "Server error",
      message: "Failed to get messages",
    });
  }
});

// Socket.IO connection handling
io.on(EVENTS.CONNECTION, (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on("connect_error", (err) => {
    console.error(`Socket connect_error: ${err.message}`);
  });

  // Create room instance for this socket
  const room = new Room(io, socket, dbConnected, { Message, RoomModel });
  ROOMS.set(socket.id, room);

  // Handle user joining room
  socket.on("ROOM:user-join-room", async (data) => {
    const validation = validateUsername(data?.username);
    if (!validation.valid) {
      socket.emit("error", { message: validation.error });
      return;
    }
    room.joinRoom({ ...data, username: validation.sanitized });
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log(`Socket disconnected: ${socket.id}`);
    room.disconnect();
    ROOMS.delete(socket.id);
  });

  // Handle typing indicators
  socket.on("MSG:user-is-typing", (data) => room.userIsTyping(data));
  socket.on("MSG:no-user-is-typing", () => room.noUserIsTyping());

  // Handle messages with validation
  socket.on(EMITTER.SEND_MESSAGE, async (message) => {
    const validation = validateMessage(message);
    if (!validation.valid) {
      socket.emit("error", { message: validation.error });
      return;
    }
    room.sendMessage(validation.sanitized);
  });

  // Handle video list events
  socket.on(EMITTER.VIDEO_LIST_EVENT, async (data) => {
    if (data.type === "add-video") {
      const validation = validateVideo(data.video);
      if (!validation.valid) {
        socket.emit("error", { message: validation.error });
        return;
      }
      room.addVideoToQueue(validation.sanitized);
    } else if (data.type === "remove-video") {
      room.removeVideoFromQueue(data.video);
    }
  });

  // Handle player events
  socket.on("event", (data) => {
    const sanitizedData = {
      ...data,
      state: sanitizeString(data.state),
      username: data.username ? sanitizeString(data.username) : undefined,
    };
    socket.broadcast.emit("receive-event", sanitizedData);
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Server error:", err.message);
  res.status(500).json({
    error: "Internal server error",
    message: config.NODE_ENV === "development" ? err.message : "An error occurred",
  });
});

export default app;
