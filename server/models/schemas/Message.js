import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["chat", "admin", "player-change"],
      default: "chat",
    },
    content: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    username: {
      type: String,
      required: true,
    },
    userId: {
      type: String,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

// Index for efficient room message queries
messageSchema.index({ roomId: 1, created_at: -1 });

// Static method to get recent messages for a room
messageSchema.statics.getRecentMessages = async function (roomId, limit = 50) {
  return this.find({ roomId })
    .sort({ created_at: -1 })
    .limit(limit)
    .lean();
};

const Message = mongoose.model("Message", messageSchema);

export default Message;
