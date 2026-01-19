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

    beforeEach(() => {
      room = new Room(mockIo as Server, mockSocket as Socket, "list-test-room");
      mockSocket.data = { roomId: "list-room" };
      (mockSocket.to as ReturnType<typeof vi.fn>).mockReturnValue({
        emit: vi.fn(),
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
});
