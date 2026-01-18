import mongoose from "mongoose";

const videoSchema = new mongoose.Schema(
  {
    videoId: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    channel: {
      type: String,
    },
    description: {
      type: String,
    },
    url: {
      type: String,
    },
    img: {
      type: String,
    },
    addedBy: {
      type: String,
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const roomSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      default: function () {
        return this.roomId;
      },
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
    hostId: {
      type: String,
    },
    currentVideoIndex: {
      type: Number,
      default: 0,
    },
    videos: [videoSchema],
    activeUsers: [
      {
        socketId: String,
        username: String,
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    playerState: {
      status: {
        type: String,
        enum: ["playing", "paused", "stopped"],
        default: "stopped",
      },
      currentTime: {
        type: Number,
        default: 0,
      },
      lastUpdated: {
        type: Date,
        default: Date.now,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Static method to find or create a room
roomSchema.statics.findOrCreateRoom = async function (roomId) {
  let room = await this.findOne({ roomId });
  if (!room) {
    room = await this.create({ roomId });
  }
  return room;
};

// Method to add a video to the queue
roomSchema.methods.addVideo = async function (video) {
  this.videos.push(video);
  return this.save();
};

// Method to remove a video from the queue
roomSchema.methods.removeVideo = async function (videoId) {
  this.videos = this.videos.filter((v) => v.videoId !== videoId);
  return this.save();
};

// Method to add a user to the room
roomSchema.methods.addUser = async function (socketId, username) {
  const existingUser = this.activeUsers.find((u) => u.socketId === socketId);
  if (!existingUser) {
    this.activeUsers.push({ socketId, username });
    return this.save();
  }
  return this;
};

// Method to remove a user from the room
roomSchema.methods.removeUser = async function (socketId) {
  this.activeUsers = this.activeUsers.filter((u) => u.socketId !== socketId);
  return this.save();
};

const RoomModel = mongoose.model("RoomModel", roomSchema);

export default RoomModel;
