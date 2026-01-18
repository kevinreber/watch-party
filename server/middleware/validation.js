/**
 * Input validation middleware using basic validation
 * Note: For production, consider using zod or joi for more robust validation
 */

// Sanitize string to prevent XSS
export const sanitizeString = (str) => {
  if (typeof str !== "string") return str;
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
};

// Validate YouTube search query
export const validateYoutubeQuery = (req, res, next) => {
  const { q } = req.query;

  if (!q || typeof q !== "string") {
    return res.status(400).json({
      error: "Invalid query",
      message: "Search query 'q' is required and must be a string",
    });
  }

  if (q.length < 1 || q.length > 200) {
    return res.status(400).json({
      error: "Invalid query length",
      message: "Search query must be between 1 and 200 characters",
    });
  }

  // Sanitize the query
  req.query.q = sanitizeString(q.trim());
  next();
};

// Validate room ID
export const validateRoomId = (req, res, next) => {
  const { roomId } = req.query;

  if (!roomId || typeof roomId !== "string") {
    return res.status(400).json({
      error: "Invalid roomId",
      message: "Room ID is required and must be a string",
    });
  }

  // Only allow alphanumeric characters, hyphens, and underscores
  const roomIdPattern = /^[a-zA-Z0-9_-]{1,50}$/;
  if (!roomIdPattern.test(roomId)) {
    return res.status(400).json({
      error: "Invalid roomId format",
      message:
        "Room ID must be 1-50 characters and contain only letters, numbers, hyphens, and underscores",
    });
  }

  req.query.roomId = sanitizeString(roomId);
  next();
};

// Validate message content
export const validateMessage = (message) => {
  if (!message || typeof message !== "object") {
    return { valid: false, error: "Invalid message format" };
  }

  const { content, username, type } = message;

  if (!content || typeof content !== "string") {
    return { valid: false, error: "Message content is required" };
  }

  if (content.length > 2000) {
    return { valid: false, error: "Message content exceeds 2000 characters" };
  }

  if (!username || typeof username !== "string") {
    return { valid: false, error: "Username is required" };
  }

  if (username.length > 50) {
    return { valid: false, error: "Username exceeds 50 characters" };
  }

  const validTypes = ["chat", "admin", "player-change"];
  if (type && !validTypes.includes(type)) {
    return { valid: false, error: "Invalid message type" };
  }

  return {
    valid: true,
    sanitized: {
      ...message,
      content: sanitizeString(content.trim()),
      username: sanitizeString(username.trim()),
      type: type || "chat",
    },
  };
};

// Validate username for socket connections
export const validateUsername = (username) => {
  if (!username || typeof username !== "string") {
    return { valid: false, error: "Username is required" };
  }

  const trimmed = username.trim();
  if (trimmed.length < 1 || trimmed.length > 50) {
    return { valid: false, error: "Username must be 1-50 characters" };
  }

  return {
    valid: true,
    sanitized: sanitizeString(trimmed),
  };
};

// Validate video object
export const validateVideo = (video) => {
  if (!video || typeof video !== "object") {
    return { valid: false, error: "Invalid video format" };
  }

  const { videoId, name } = video;

  if (!videoId || typeof videoId !== "string") {
    return { valid: false, error: "Video ID is required" };
  }

  // YouTube video IDs are 11 characters
  const videoIdPattern = /^[a-zA-Z0-9_-]{11}$/;
  if (!videoIdPattern.test(videoId)) {
    return { valid: false, error: "Invalid YouTube video ID format" };
  }

  if (!name || typeof name !== "string") {
    return { valid: false, error: "Video name is required" };
  }

  return {
    valid: true,
    sanitized: {
      ...video,
      videoId: sanitizeString(videoId),
      name: sanitizeString(name.slice(0, 200)),
      channel: video.channel ? sanitizeString(video.channel.slice(0, 100)) : "",
      description: video.description
        ? sanitizeString(video.description.slice(0, 500))
        : "",
      url: video.url ? sanitizeString(video.url) : "",
      img: video.img ? sanitizeString(video.img) : "",
    },
  };
};
