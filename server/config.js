import dotenv from "dotenv";
dotenv.config();

// require("dotenv").config();

const defaults = {
  DB_URI: "", // MongoDB URI
  YOUTUBE_API_KEY: "", // YouTube API Key
};

export default {
  ...defaults,
  ...process.env,
};
