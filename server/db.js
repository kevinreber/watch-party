import mongoose from "mongoose";
import config from "./config.js";

const connectDB = async () => {
  try {
    if (!config.MONGODB_URI) {
      console.warn("MONGODB_URI not set. Running without database persistence.");
      return null;
    }

    const conn = await mongoose.connect(config.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
