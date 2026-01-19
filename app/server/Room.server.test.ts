import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Server, Socket } from "socket.io";
import { Room } from "./Room.server";

// Mock socket and io objects
const createMockSocket = (): Partial<Socket> => ({
  id: "test-socket-id",
  data: {} as any,
  on: vi.fn(),
  emit: vi.fn(),
  join: vi.fn(),
  to: vi.fn().mockReturnThis(),
  broadcast: {
    emit: vi.fn(),
  } as any,
});

const createMockIo = (): Partial<Server> => ({
  engine: {
    clientsCount: 1,
  } as any,
  sockets: {
    emit: vi.fn(),
    adapter: {
      rooms: new Map([
        ["test-room", new Set(["socket-1", "socket-2"])],
        ["empty-room", new Set()],
      ]),
    },
  } as any,
  to: vi.fn().mockReturnThis(),
});

describe("Room", () => {
  let mockSocket: ReturnType<typeof createMockSocket>;
  let mockIo: ReturnType<typeof createMockIo>;

  beforeEach(() => {
    mockSocket = createMockSocket();
    mockIo = createMockIo();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("constructor", () => {
    it("should initialize with correct properties", () => {
      const room = new Room(mockIo as Server, mockSocket as Socket, "test-room");

      expect(room.io).toBe(mockIo);
      expect(room.socket).toBe(mockSocket);
      expect(room.roomName).toBe("test-room");
      expect(room.private).toBe(false);
      expect(room.users).toBeInstanceOf(Map);
      expect(room.videos).toEqual([]);
      expect(room.messages).toEqual([]);
    });

    it("should set up socket event listeners", () => {
      new Room(mockIo as Server, mockSocket as Socket, "test-room");

      const onCalls = (mockSocket.on as ReturnType<typeof vi.fn>).mock.calls;
      const eventNames = onCalls.map((call: any[]) => call[0]);

      expect(eventNames).toContain("ROOM:user-join-room");
      expect(eventNames).toContain("disconnect");
      expect(eventNames).toContain("MSG:user-is-typing");
      expect(eventNames).toContain("MSG:no-user-is-typing");
      expect(eventNames).toContain("send_message");
      expect(eventNames).toContain("VIDEO:sync");
      expect(eventNames).toContain("VIDEO:request-sync");
      expect(eventNames).toContain("event");
      expect(eventNames).toContain("request-video-state");
      expect(eventNames).toContain("video_list_event");
    });
  });

  describe("handleVideoSync", () => {
    let room: Room;

    beforeEach(() => {
      room = new Room(mockIo as Server, mockSocket as Socket, "video-test-room");
      (mockSocket.to as ReturnType<typeof vi.fn>).mockReturnValue({
        emit: vi.fn(),
      });
    });

    it("should handle play event", () => {
      const event = {
        roomId: "play-test-room",
        type: "play" as const,
        currentTime: 45.5,
        timestamp: Date.now(),
      };

      room.handleVideoSync(event);

      expect(mockSocket.to).toHaveBeenCalledWith("play-test-room");
    });

    it("should handle pause event", () => {
      const event = {
        roomId: "pause-test-room",
        type: "pause" as const,
        currentTime: 60.5,
        timestamp: Date.now(),
      };

      room.handleVideoSync(event);

      expect(mockSocket.to).toHaveBeenCalledWith("pause-test-room");
    });

    it("should handle seek event", () => {
      const event = {
        roomId: "seek-test-room",
        type: "seek" as const,
        currentTime: 300,
        timestamp: Date.now(),
      };

      room.handleVideoSync(event);

      expect(mockSocket.to).toHaveBeenCalledWith("seek-test-room");
    });
  });

  describe("handleSyncRequest", () => {
    let room: Room;

    beforeEach(() => {
      room = new Room(mockIo as Server, mockSocket as Socket, "sync-test-room");
    });

    it("should send video state to the requesting client", () => {
      // First trigger a play event to set up state
      (mockSocket.to as ReturnType<typeof vi.fn>).mockReturnValue({
        emit: vi.fn(),
      });
      room.handleVideoSync({
        roomId: "sync-room",
        type: "play",
        currentTime: 100,
        timestamp: Date.now(),
      });

      room.handleSyncRequest({ roomId: "sync-room" });

      expect(mockSocket.emit).toHaveBeenCalledWith(
        "VIDEO:sync-state",
        expect.objectContaining({
          isPlaying: true,
          currentTime: expect.any(Number),
        })
      );
    });
  });

  describe("handleLegacyVideoEvent", () => {
    let room: Room;

    beforeEach(() => {
      room = new Room(mockIo as Server, mockSocket as Socket, "legacy-test-room");
    });

    it("should handle load-video event", () => {
      const data = {
        state: "load-video",
        videoId: { videoId: "abc123", name: "Test Video" },
      };

      room.handleLegacyVideoEvent(data, "legacy-room");

      expect(mockSocket.broadcast.emit).toHaveBeenCalledWith("receive-event", data);
    });

    it("should handle play event", () => {
      const data = {
        state: "play",
        currentTime: 45.5,
        username: "testuser",
      };

      room.handleLegacyVideoEvent(data, "play-room");

      expect(mockSocket.broadcast.emit).toHaveBeenCalledWith("receive-event", data);
    });

    it("should handle pause event", () => {
      const data = {
        state: "pause",
        currentTime: 60.5,
        username: "testuser",
      };

      room.handleLegacyVideoEvent(data, "pause-room");

      expect(mockSocket.broadcast.emit).toHaveBeenCalledWith("receive-event", data);
    });

    it("should handle seek event", () => {
      const data = {
        state: "seek",
        newTime: 300,
        value: 50,
        username: "testuser",
      };

      room.handleLegacyVideoEvent(data, "seek-room");

      expect(mockSocket.broadcast.emit).toHaveBeenCalledWith("receive-event", data);
    });
  });

  describe("handleLegacySyncRequest", () => {
    let room: Room;

    beforeEach(() => {
      room = new Room(mockIo as Server, mockSocket as Socket, "legacy-sync-room");
    });

    it("should send legacy video state to the client", () => {
      // First set up some state
      room.handleLegacyVideoEvent(
        { state: "play", currentTime: 100 },
        "legacy-sync"
      );

      room.handleLegacySyncRequest("legacy-sync");

      expect(mockSocket.emit).toHaveBeenCalledWith(
        "video-state-sync",
        expect.objectContaining({
          currentTime: expect.any(Number),
        })
      );
    });
  });

  describe("handleVideoListEvent", () => {
    let room: Room;
    let mockEmit: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      room = new Room(mockIo as Server, mockSocket as Socket, "list-test-room");
      mockSocket.data = { roomId: "list-room" };
      mockEmit = vi.fn();
      (mockSocket.to as ReturnType<typeof vi.fn>).mockReturnValue({
        emit: mockEmit,
      });
    });

    it("should add video to the list", () => {
      const video = { videoId: "new-video", url: "http://youtube.com/watch?v=new-video", name: "New Video" };
      const data = {
        type: "add-video",
        video,
        roomId: "list-room",
      };

      room.handleVideoListEvent(data);

      expect(mockSocket.to).toHaveBeenCalledWith("list-room");
    });

    it("should remove video from the list", () => {
      const video = { videoId: "remove-me", url: "http://youtube.com/watch?v=remove-me", name: "Remove Me" };

      // First add the video
      room.handleVideoListEvent({
        type: "add-video",
        video,
        roomId: "remove-room",
      });

      // Then remove it
      room.handleVideoListEvent({
        type: "remove-video",
        video,
        roomId: "remove-room",
      });

      expect(mockSocket.to).toHaveBeenCalledWith("remove-room");
    });

    describe("video removal by videoId", () => {
      it("should remove video using videoId comparison, not object reference", () => {
        const uniqueRoomId = "videoId-comparison-room-" + Date.now();
        const video1 = { videoId: "video-1", url: "http://youtube.com/watch?v=video-1", name: "Video 1" };
        const video2 = { videoId: "video-2", url: "http://youtube.com/watch?v=video-2", name: "Video 2" };

        // Add two videos
        room.handleVideoListEvent({ type: "add-video", video: video1, roomId: uniqueRoomId });
        room.handleVideoListEvent({ type: "add-video", video: video2, roomId: uniqueRoomId });

        // Create a NEW object with the same videoId (simulating deserialized JSON from socket)
        const video1Copy = { videoId: "video-1", url: "http://youtube.com/watch?v=video-1", name: "Video 1" };

        // Remove using the copy (different object reference, same videoId)
        room.handleVideoListEvent({ type: "remove-video", video: video1Copy, roomId: uniqueRoomId });

        // Verify the broadcast contains only video2
        expect(mockEmit).toHaveBeenLastCalledWith(
          "update_video_list",
          expect.objectContaining({
            type: "remove-video",
            videos: [video2],
          })
        );
      });

      it("should correctly remove a video from the middle of the queue", () => {
        const uniqueRoomId = "middle-removal-room-" + Date.now();
        const video1 = { videoId: "first", url: "http://youtube.com/watch?v=first", name: "First Video" };
        const video2 = { videoId: "middle", url: "http://youtube.com/watch?v=middle", name: "Middle Video" };
        const video3 = { videoId: "last", url: "http://youtube.com/watch?v=last", name: "Last Video" };

        // Add three videos
        room.handleVideoListEvent({ type: "add-video", video: video1, roomId: uniqueRoomId });
        room.handleVideoListEvent({ type: "add-video", video: video2, roomId: uniqueRoomId });
        room.handleVideoListEvent({ type: "add-video", video: video3, roomId: uniqueRoomId });

        // Remove the middle video
        room.handleVideoListEvent({ type: "remove-video", video: { videoId: "middle" }, roomId: uniqueRoomId });

        // Verify only first and last remain
        expect(mockEmit).toHaveBeenLastCalledWith(
          "update_video_list",
          expect.objectContaining({
            videos: expect.arrayContaining([
              expect.objectContaining({ videoId: "first" }),
              expect.objectContaining({ videoId: "last" }),
            ]),
          })
        );

        // Verify middle video is not in the list
        const lastCall = mockEmit.mock.calls[mockEmit.mock.calls.length - 1];
        const videos = lastCall[1].videos;
        expect(videos.length).toBe(2);
        expect(videos.find((v: any) => v.videoId === "middle")).toBeUndefined();
      });

      it("should remove the currently playing video (first in queue)", () => {
        const uniqueRoomId = "first-removal-room-" + Date.now();
        const currentVideo = { videoId: "now-playing", url: "http://youtube.com/watch?v=now-playing", name: "Now Playing" };
        const nextVideo = { videoId: "up-next", url: "http://youtube.com/watch?v=up-next", name: "Up Next" };

        // Add videos (first one is "now playing")
        room.handleVideoListEvent({ type: "add-video", video: currentVideo, roomId: uniqueRoomId });
        room.handleVideoListEvent({ type: "add-video", video: nextVideo, roomId: uniqueRoomId });

        // Remove the currently playing video (simulating playNextVideo)
        room.handleVideoListEvent({ type: "remove-video", video: { videoId: "now-playing" }, roomId: uniqueRoomId });

        // Verify only the next video remains
        expect(mockEmit).toHaveBeenLastCalledWith(
          "update_video_list",
          expect.objectContaining({
            videos: [expect.objectContaining({ videoId: "up-next" })],
          })
        );
      });

      it("should handle removing a non-existent video gracefully", () => {
        const uniqueRoomId = "non-existent-removal-room-" + Date.now();
        const video1 = { videoId: "exists", url: "http://youtube.com/watch?v=exists", name: "Exists" };

        // Add a video
        room.handleVideoListEvent({ type: "add-video", video: video1, roomId: uniqueRoomId });

        // Try to remove a video that doesn't exist
        room.handleVideoListEvent({ type: "remove-video", video: { videoId: "does-not-exist" }, roomId: uniqueRoomId });

        // Verify the original video is still there
        expect(mockEmit).toHaveBeenLastCalledWith(
          "update_video_list",
          expect.objectContaining({
            videos: [expect.objectContaining({ videoId: "exists" })],
          })
        );
      });

      it("should handle removing from an empty queue", () => {
        const uniqueRoomId = "empty-queue-room-" + Date.now();

        // Try to remove from empty queue
        room.handleVideoListEvent({ type: "remove-video", video: { videoId: "ghost" }, roomId: uniqueRoomId });

        // Verify empty array is broadcast
        expect(mockEmit).toHaveBeenLastCalledWith(
          "update_video_list",
          expect.objectContaining({
            videos: [],
          })
        );
      });

      it("should broadcast to the correct room after removal", () => {
        const uniqueRoomId = "broadcast-test-room-" + Date.now();
        const video = { videoId: "test-video", url: "http://youtube.com/watch?v=test", name: "Test" };

        room.handleVideoListEvent({ type: "add-video", video, roomId: uniqueRoomId });
        room.handleVideoListEvent({ type: "remove-video", video: { videoId: "test-video" }, roomId: uniqueRoomId });

        expect(mockSocket.to).toHaveBeenCalledWith(uniqueRoomId);
        expect(mockEmit).toHaveBeenCalledWith("update_video_list", expect.any(Object));
      });
    });

    describe("end-to-end queue scenarios", () => {
      it("should handle complete queue workflow: add multiple, remove one, add another", () => {
        const uniqueRoomId = "e2e-workflow-room-" + Date.now();
        const video1 = { videoId: "v1", url: "http://youtube.com/watch?v=v1", name: "Video 1" };
        const video2 = { videoId: "v2", url: "http://youtube.com/watch?v=v2", name: "Video 2" };
        const video3 = { videoId: "v3", url: "http://youtube.com/watch?v=v3", name: "Video 3" };
        const video4 = { videoId: "v4", url: "http://youtube.com/watch?v=v4", name: "Video 4" };

        // Add three videos
        room.handleVideoListEvent({ type: "add-video", video: video1, roomId: uniqueRoomId });
        room.handleVideoListEvent({ type: "add-video", video: video2, roomId: uniqueRoomId });
        room.handleVideoListEvent({ type: "add-video", video: video3, roomId: uniqueRoomId });

        // Remove video2
        room.handleVideoListEvent({ type: "remove-video", video: { videoId: "v2" }, roomId: uniqueRoomId });

        // Add video4
        room.handleVideoListEvent({ type: "add-video", video: video4, roomId: uniqueRoomId });

        // Verify final state: v1, v3, v4
        expect(mockEmit).toHaveBeenLastCalledWith(
          "update_video_list",
          expect.objectContaining({
            videos: [
              expect.objectContaining({ videoId: "v1" }),
              expect.objectContaining({ videoId: "v3" }),
              expect.objectContaining({ videoId: "v4" }),
            ],
          })
        );
      });

      it("should handle sequential removal of all videos", () => {
        const uniqueRoomId = "sequential-removal-room-" + Date.now();
        const video1 = { videoId: "seq1", url: "http://youtube.com/watch?v=seq1", name: "Seq 1" };
        const video2 = { videoId: "seq2", url: "http://youtube.com/watch?v=seq2", name: "Seq 2" };
        const video3 = { videoId: "seq3", url: "http://youtube.com/watch?v=seq3", name: "Seq 3" };

        // Add all videos
        room.handleVideoListEvent({ type: "add-video", video: video1, roomId: uniqueRoomId });
        room.handleVideoListEvent({ type: "add-video", video: video2, roomId: uniqueRoomId });
        room.handleVideoListEvent({ type: "add-video", video: video3, roomId: uniqueRoomId });

        // Remove them one by one (simulating playNextVideo advancing through queue)
        room.handleVideoListEvent({ type: "remove-video", video: { videoId: "seq1" }, roomId: uniqueRoomId });

        let lastCall = mockEmit.mock.calls[mockEmit.mock.calls.length - 1];
        expect(lastCall[1].videos.length).toBe(2);

        room.handleVideoListEvent({ type: "remove-video", video: { videoId: "seq2" }, roomId: uniqueRoomId });

        lastCall = mockEmit.mock.calls[mockEmit.mock.calls.length - 1];
        expect(lastCall[1].videos.length).toBe(1);

        room.handleVideoListEvent({ type: "remove-video", video: { videoId: "seq3" }, roomId: uniqueRoomId });

        lastCall = mockEmit.mock.calls[mockEmit.mock.calls.length - 1];
        expect(lastCall[1].videos.length).toBe(0);
      });

      it("should use socket.data.roomId as fallback when roomId not provided", () => {
        const fallbackRoomId = "fallback-room-" + Date.now();
        mockSocket.data = { roomId: fallbackRoomId };

        const video = { videoId: "fallback-video", url: "http://youtube.com/watch?v=fb", name: "Fallback" };

        // Add without explicit roomId
        room.handleVideoListEvent({ type: "add-video", video });
        room.handleVideoListEvent({ type: "remove-video", video: { videoId: "fallback-video" } });

        expect(mockSocket.to).toHaveBeenCalledWith(fallbackRoomId);
      });
    });
  });

  describe("joinRoom", () => {
    let room: Room;

    beforeEach(() => {
      room = new Room(mockIo as Server, mockSocket as Socket, "join-test-room");
      (mockSocket.to as ReturnType<typeof vi.fn>).mockReturnValue({
        emit: vi.fn(),
      });
      (mockIo.to as ReturnType<typeof vi.fn>).mockReturnValue({
        emit: vi.fn(),
      });
    });

    it("should set username on socket data", () => {
      room.joinRoom({ username: "TestUser" });

      expect(mockSocket.data.username).toBe("TestUser");
    });

    it("should join the socket room when roomId is provided", () => {
      room.joinRoom({ username: "TestUser", roomId: "my-room" });

      expect(mockSocket.join).toHaveBeenCalledWith("my-room");
    });

    it("should send video state to new user when roomId is provided", () => {
      room.joinRoom({ username: "NewUser", roomId: "sync-room" });

      expect(mockSocket.emit).toHaveBeenCalledWith(
        "VIDEO:sync-state",
        expect.any(Object)
      );
      expect(mockSocket.emit).toHaveBeenCalledWith(
        "video-state-sync",
        expect.any(Object)
      );
    });
  });

  describe("getClientCount", () => {
    it("should return the client count from io.engine", () => {
      (mockIo as any).engine.clientsCount = 5;
      const room = new Room(mockIo as Server, mockSocket as Socket, "count-test-room");

      expect(room.getClientCount()).toBe(5);
    });
  });

  describe("getRoomUserCount", () => {
    it("should return the number of users in a specific room", () => {
      const room = new Room(mockIo as Server, mockSocket as Socket, "room-count-test");

      // test-room has 2 users in our mock
      expect(room.getRoomUserCount("test-room")).toBe(2);
    });

    it("should return 0 for an empty room", () => {
      const room = new Room(mockIo as Server, mockSocket as Socket, "room-count-test");

      expect(room.getRoomUserCount("empty-room")).toBe(0);
    });

    it("should return 0 for a non-existent room", () => {
      const room = new Room(mockIo as Server, mockSocket as Socket, "room-count-test");

      expect(room.getRoomUserCount("non-existent-room")).toBe(0);
    });
  });
});
