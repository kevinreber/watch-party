import { describe, it, expect, beforeEach } from "vitest";
import { loader, action } from "./api.video-state";

// Helper to create mock request
function createMockRequest(url: string, options: RequestInit = {}): Request {
  return new Request(url, options);
}

describe("api.video-state", () => {
  // Clear state between tests by using unique room IDs
  const getUniqueRoomId = () => `test-room-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  describe("loader (GET)", () => {
    it("should return error when roomId is missing", async () => {
      const request = createMockRequest("http://localhost/api/video-state");
      const response = await loader({ request, params: {}, context: {} });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("roomId is required");
    });

    it("should return initial state for new room", async () => {
      const roomId = getUniqueRoomId();
      const request = createMockRequest(`http://localhost/api/video-state?roomId=${roomId}`);
      const response = await loader({ request, params: {}, context: {} });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.isPlaying).toBe(false);
      expect(data.currentTime).toBe(0);
      expect(data.videos).toEqual([]);
    });
  });

  describe("action (POST)", () => {
    it("should return error when roomId is missing", async () => {
      const request = createMockRequest("http://localhost/api/video-state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "play" }),
      });
      const response = await action({ request, params: {}, context: {} });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("roomId is required");
    });

    it("should return error for invalid type", async () => {
      const roomId = getUniqueRoomId();
      const request = createMockRequest("http://localhost/api/video-state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, type: "invalid-type" }),
      });
      const response = await action({ request, params: {}, context: {} });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid type");
    });

    describe("add-video", () => {
      it("should add video to the list", async () => {
        const roomId = getUniqueRoomId();
        const video = { videoId: "test-1", url: "http://youtube.com/watch?v=test-1", name: "Test Video" };

        const request = createMockRequest("http://localhost/api/video-state", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomId, type: "add-video", video }),
        });
        const response = await action({ request, params: {}, context: {} });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.state.videos).toHaveLength(1);
        expect(data.state.videos[0].videoId).toBe("test-1");
      });

      it("should set first video as current videoId", async () => {
        const roomId = getUniqueRoomId();
        const video = { videoId: "first-video", url: "http://youtube.com/watch?v=first", name: "First" };

        const request = createMockRequest("http://localhost/api/video-state", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomId, type: "add-video", video }),
        });
        const response = await action({ request, params: {}, context: {} });
        const data = await response.json();

        expect(data.state.videoId).toEqual(video);
      });

      it("should not add duplicate videos", async () => {
        const roomId = getUniqueRoomId();
        const video = { videoId: "dup-test", url: "http://youtube.com/watch?v=dup", name: "Duplicate" };

        // Add first time
        await action({
          request: createMockRequest("http://localhost/api/video-state", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ roomId, type: "add-video", video }),
          }),
          params: {},
          context: {},
        });

        // Add second time
        const response = await action({
          request: createMockRequest("http://localhost/api/video-state", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ roomId, type: "add-video", video }),
          }),
          params: {},
          context: {},
        });
        const data = await response.json();

        expect(data.state.videos).toHaveLength(1);
      });
    });

    describe("remove-video", () => {
      it("should remove video using videoId comparison, not object reference", async () => {
        const roomId = getUniqueRoomId();
        const video1 = { videoId: "video-1", url: "http://youtube.com/watch?v=v1", name: "Video 1" };
        const video2 = { videoId: "video-2", url: "http://youtube.com/watch?v=v2", name: "Video 2" };

        // Add two videos
        await action({
          request: createMockRequest("http://localhost/api/video-state", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ roomId, type: "add-video", video: video1 }),
          }),
          params: {},
          context: {},
        });
        await action({
          request: createMockRequest("http://localhost/api/video-state", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ roomId, type: "add-video", video: video2 }),
          }),
          params: {},
          context: {},
        });

        // Remove using a NEW object with same videoId (simulating deserialized JSON)
        const video1Copy = { videoId: "video-1", url: "http://youtube.com/watch?v=v1", name: "Video 1" };
        const response = await action({
          request: createMockRequest("http://localhost/api/video-state", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ roomId, type: "remove-video", video: video1Copy }),
          }),
          params: {},
          context: {},
        });
        const data = await response.json();

        expect(data.state.videos).toHaveLength(1);
        expect(data.state.videos[0].videoId).toBe("video-2");
      });

      it("should correctly remove video from middle of queue", async () => {
        const roomId = getUniqueRoomId();
        const video1 = { videoId: "first", url: "http://youtube.com/watch?v=first", name: "First" };
        const video2 = { videoId: "middle", url: "http://youtube.com/watch?v=middle", name: "Middle" };
        const video3 = { videoId: "last", url: "http://youtube.com/watch?v=last", name: "Last" };

        // Add three videos
        for (const video of [video1, video2, video3]) {
          await action({
            request: createMockRequest("http://localhost/api/video-state", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ roomId, type: "add-video", video }),
            }),
            params: {},
            context: {},
          });
        }

        // Remove middle
        const response = await action({
          request: createMockRequest("http://localhost/api/video-state", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ roomId, type: "remove-video", video: { videoId: "middle" } }),
          }),
          params: {},
          context: {},
        });
        const data = await response.json();

        expect(data.state.videos).toHaveLength(2);
        expect(data.state.videos[0].videoId).toBe("first");
        expect(data.state.videos[1].videoId).toBe("last");
      });

      it("should remove the currently playing video (first in queue)", async () => {
        const roomId = getUniqueRoomId();
        const currentVideo = { videoId: "now-playing", url: "http://youtube.com/watch?v=np", name: "Now Playing" };
        const nextVideo = { videoId: "up-next", url: "http://youtube.com/watch?v=un", name: "Up Next" };

        // Add videos
        await action({
          request: createMockRequest("http://localhost/api/video-state", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ roomId, type: "add-video", video: currentVideo }),
          }),
          params: {},
          context: {},
        });
        await action({
          request: createMockRequest("http://localhost/api/video-state", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ roomId, type: "add-video", video: nextVideo }),
          }),
          params: {},
          context: {},
        });

        // Remove current (simulating playNextVideo)
        const response = await action({
          request: createMockRequest("http://localhost/api/video-state", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ roomId, type: "remove-video", video: { videoId: "now-playing" } }),
          }),
          params: {},
          context: {},
        });
        const data = await response.json();

        expect(data.state.videos).toHaveLength(1);
        expect(data.state.videos[0].videoId).toBe("up-next");
      });

      it("should handle removing non-existent video gracefully", async () => {
        const roomId = getUniqueRoomId();
        const video = { videoId: "exists", url: "http://youtube.com/watch?v=ex", name: "Exists" };

        // Add a video
        await action({
          request: createMockRequest("http://localhost/api/video-state", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ roomId, type: "add-video", video }),
          }),
          params: {},
          context: {},
        });

        // Try to remove non-existent video
        const response = await action({
          request: createMockRequest("http://localhost/api/video-state", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ roomId, type: "remove-video", video: { videoId: "does-not-exist" } }),
          }),
          params: {},
          context: {},
        });
        const data = await response.json();

        expect(data.state.videos).toHaveLength(1);
        expect(data.state.videos[0].videoId).toBe("exists");
      });

      it("should handle removing from empty queue", async () => {
        const roomId = getUniqueRoomId();

        const response = await action({
          request: createMockRequest("http://localhost/api/video-state", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ roomId, type: "remove-video", video: { videoId: "ghost" } }),
          }),
          params: {},
          context: {},
        });
        const data = await response.json();

        expect(data.state.videos).toHaveLength(0);
      });
    });

    describe("end-to-end queue scenarios", () => {
      it("should handle complete queue workflow: add multiple, remove one, add another", async () => {
        const roomId = getUniqueRoomId();
        const video1 = { videoId: "v1", url: "http://youtube.com/watch?v=v1", name: "Video 1" };
        const video2 = { videoId: "v2", url: "http://youtube.com/watch?v=v2", name: "Video 2" };
        const video3 = { videoId: "v3", url: "http://youtube.com/watch?v=v3", name: "Video 3" };
        const video4 = { videoId: "v4", url: "http://youtube.com/watch?v=v4", name: "Video 4" };

        // Add three videos
        for (const video of [video1, video2, video3]) {
          await action({
            request: createMockRequest("http://localhost/api/video-state", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ roomId, type: "add-video", video }),
            }),
            params: {},
            context: {},
          });
        }

        // Remove video2
        await action({
          request: createMockRequest("http://localhost/api/video-state", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ roomId, type: "remove-video", video: { videoId: "v2" } }),
          }),
          params: {},
          context: {},
        });

        // Add video4
        const response = await action({
          request: createMockRequest("http://localhost/api/video-state", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ roomId, type: "add-video", video: video4 }),
          }),
          params: {},
          context: {},
        });
        const data = await response.json();

        expect(data.state.videos).toHaveLength(3);
        expect(data.state.videos.map((v: any) => v.videoId)).toEqual(["v1", "v3", "v4"]);
      });

      it("should handle sequential removal of all videos", async () => {
        const roomId = getUniqueRoomId();
        const videos = [
          { videoId: "seq1", url: "http://youtube.com/watch?v=seq1", name: "Seq 1" },
          { videoId: "seq2", url: "http://youtube.com/watch?v=seq2", name: "Seq 2" },
          { videoId: "seq3", url: "http://youtube.com/watch?v=seq3", name: "Seq 3" },
        ];

        // Add all videos
        for (const video of videos) {
          await action({
            request: createMockRequest("http://localhost/api/video-state", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ roomId, type: "add-video", video }),
            }),
            params: {},
            context: {},
          });
        }

        // Remove them one by one
        for (let i = 0; i < videos.length; i++) {
          const response = await action({
            request: createMockRequest("http://localhost/api/video-state", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ roomId, type: "remove-video", video: { videoId: videos[i].videoId } }),
            }),
            params: {},
            context: {},
          });
          const data = await response.json();
          expect(data.state.videos).toHaveLength(videos.length - 1 - i);
        }

        // Verify final state via loader
        const getResponse = await loader({
          request: createMockRequest(`http://localhost/api/video-state?roomId=${roomId}`),
          params: {},
          context: {},
        });
        const finalState = await getResponse.json();
        expect(finalState.videos).toHaveLength(0);
      });
    });

    describe("play/pause/seek", () => {
      it("should update isPlaying to true on play", async () => {
        const roomId = getUniqueRoomId();
        const response = await action({
          request: createMockRequest("http://localhost/api/video-state", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ roomId, type: "play", currentTime: 10 }),
          }),
          params: {},
          context: {},
        });
        const data = await response.json();

        expect(data.state.isPlaying).toBe(true);
        expect(data.state.currentTime).toBe(10);
      });

      it("should update isPlaying to false on pause", async () => {
        const roomId = getUniqueRoomId();

        // First play
        await action({
          request: createMockRequest("http://localhost/api/video-state", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ roomId, type: "play", currentTime: 10 }),
          }),
          params: {},
          context: {},
        });

        // Then pause
        const response = await action({
          request: createMockRequest("http://localhost/api/video-state", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ roomId, type: "pause", currentTime: 20 }),
          }),
          params: {},
          context: {},
        });
        const data = await response.json();

        expect(data.state.isPlaying).toBe(false);
        expect(data.state.currentTime).toBe(20);
      });

      it("should update currentTime on seek", async () => {
        const roomId = getUniqueRoomId();
        const response = await action({
          request: createMockRequest("http://localhost/api/video-state", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ roomId, type: "seek", currentTime: 300 }),
          }),
          params: {},
          context: {},
        });
        const data = await response.json();

        expect(data.state.currentTime).toBe(300);
      });
    });
  });
});
