import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 50,
    },
    socketId: {
      type: String,
      index: true,
    },
    avatarColor: {
      type: String,
      default: "#54b78a",
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster lookups
userSchema.index({ socketId: 1 });
userSchema.index({ username: 1 });

const User = mongoose.model("User", userSchema);

export default User;
