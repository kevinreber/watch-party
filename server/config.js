import dotenv from "dotenv";
dotenv.config();

// Whitelist specific environment variables for security
const config = {
  // MongoDB Configuration
  MONGODB_URI: process.env.MONGODB_URI || "",

  // YouTube API
  YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY || "",

  // Server Configuration
  PORT: process.env.PORT || 3001,
  NODE_ENV: process.env.NODE_ENV || "development",

  // CORS Configuration - comma-separated list of allowed origins
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",").map((origin) => origin.trim())
    : ["http://localhost:3000", "http://localhost:3001"],

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
};

export default config;
