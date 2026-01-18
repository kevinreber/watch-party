import {
  sanitizeString,
  validateMessage,
  validateUsername,
  validateVideo,
} from "./validation.js";

describe("Validation Middleware", () => {
  describe("sanitizeString", () => {
    it("should escape HTML special characters", () => {
      expect(sanitizeString("<script>alert('xss')</script>")).toBe(
        "&lt;script&gt;alert(&#x27;xss&#x27;)&lt;&#x2F;script&gt;"
      );
    });

    it("should escape ampersands", () => {
      expect(sanitizeString("foo & bar")).toBe("foo &amp; bar");
    });

    it("should escape quotes", () => {
      expect(sanitizeString('"hello"')).toBe("&quot;hello&quot;");
    });

    it("should return non-string values unchanged", () => {
      expect(sanitizeString(123)).toBe(123);
      expect(sanitizeString(null)).toBe(null);
    });
  });

  describe("validateMessage", () => {
    it("should validate a correct message", () => {
      const message = {
        content: "Hello world",
        username: "testuser",
        type: "chat",
      };
      const result = validateMessage(message);
      expect(result.valid).toBe(true);
      expect(result.sanitized.content).toBe("Hello world");
    });

    it("should reject message without content", () => {
      const message = { username: "testuser" };
      const result = validateMessage(message);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("content");
    });

    it("should reject message without username", () => {
      const message = { content: "Hello" };
      const result = validateMessage(message);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("Username");
    });

    it("should reject message with content exceeding 2000 characters", () => {
      const message = {
        content: "a".repeat(2001),
        username: "testuser",
      };
      const result = validateMessage(message);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("2000");
    });

    it("should sanitize XSS in message content", () => {
      const message = {
        content: "<script>alert('xss')</script>",
        username: "testuser",
      };
      const result = validateMessage(message);
      expect(result.valid).toBe(true);
      expect(result.sanitized.content).not.toContain("<script>");
    });
  });

  describe("validateUsername", () => {
    it("should validate a correct username", () => {
      const result = validateUsername("testuser");
      expect(result.valid).toBe(true);
      expect(result.sanitized).toBe("testuser");
    });

    it("should reject empty username", () => {
      const result = validateUsername("");
      expect(result.valid).toBe(false);
    });

    it("should reject username exceeding 50 characters", () => {
      const result = validateUsername("a".repeat(51));
      expect(result.valid).toBe(false);
    });

    it("should trim whitespace", () => {
      const result = validateUsername("  testuser  ");
      expect(result.valid).toBe(true);
      expect(result.sanitized).toBe("testuser");
    });
  });

  describe("validateVideo", () => {
    it("should validate a correct video object", () => {
      const video = {
        videoId: "dQw4w9WgXcQ",
        name: "Test Video",
      };
      const result = validateVideo(video);
      expect(result.valid).toBe(true);
    });

    it("should reject video without videoId", () => {
      const video = { name: "Test Video" };
      const result = validateVideo(video);
      expect(result.valid).toBe(false);
    });

    it("should reject invalid videoId format", () => {
      const video = {
        videoId: "invalid",
        name: "Test Video",
      };
      const result = validateVideo(video);
      expect(result.valid).toBe(false);
    });

    it("should reject video without name", () => {
      const video = { videoId: "dQw4w9WgXcQ" };
      const result = validateVideo(video);
      expect(result.valid).toBe(false);
    });
  });
});
