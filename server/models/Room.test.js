import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Room } from './Room.js';

// Mock socket and io objects
const createMockSocket = () => ({
  id: 'test-socket-id',
  data: {},
  on: vi.fn(),
  emit: vi.fn(),
  broadcast: {
    emit: vi.fn(),
  },
});

const createMockIo = () => ({
  engine: {
    clientsCount: 1,
  },
  sockets: {
    emit: vi.fn(),
  },
});

describe('Room', () => {
  let mockSocket;
  let mockIo;

  beforeEach(() => {
    mockSocket = createMockSocket();
    mockIo = createMockIo();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with correct properties', () => {
      const room = new Room(mockIo, mockSocket, 'test-room');

      expect(room.io).toBe(mockIo);
      expect(room.socket).toBe(mockSocket);
      expect(room.roomName).toBe('test-room');
      expect(room.private).toBe(false);
      expect(room.users).toBeInstanceOf(Map);
      expect(room.videos).toEqual([]);
      expect(room.messages).toEqual([]);
    });

    it('should set up socket event listeners', () => {
      new Room(mockIo, mockSocket, 'test-room');

      // Check that socket.on was called for each event
      const onCalls = mockSocket.on.mock.calls;
      const eventNames = onCalls.map(call => call[0]);

      expect(eventNames).toContain('ROOM:user-join-room');
      expect(eventNames).toContain('disconnect');
      expect(eventNames).toContain('MSG:user-is-typing');
      expect(eventNames).toContain('MSG:no-user-is-typing');
      expect(eventNames).toContain('send_message');
      expect(eventNames).toContain('event');
      expect(eventNames).toContain('request-video-state');
      expect(eventNames).toContain('video_list_event');
    });
  });

  describe('Video State Management', () => {
    it('should create initial video state for a new room', () => {
      const videoState = Room.getVideoState('new-room');

      expect(videoState).toEqual({
        videoId: null,
        currentTime: 0,
        isPlaying: false,
        lastUpdated: expect.any(Number),
        videos: [],
      });
    });

    it('should return existing video state for the same room', () => {
      const state1 = Room.getVideoState('same-room');
      state1.videoId = 'test-video';

      const state2 = Room.getVideoState('same-room');

      expect(state2.videoId).toBe('test-video');
    });

    it('should update video state correctly', () => {
      const roomId = 'update-test-room';
      Room.getVideoState(roomId); // Initialize

      const updatedState = Room.updateVideoState(roomId, {
        videoId: 'new-video',
        currentTime: 120,
        isPlaying: true,
      });

      expect(updatedState.videoId).toBe('new-video');
      expect(updatedState.currentTime).toBe(120);
      expect(updatedState.isPlaying).toBe(true);
      expect(updatedState.lastUpdated).toBeGreaterThan(0);
    });
  });

  describe('handleVideoEvent', () => {
    let room;

    beforeEach(() => {
      room = new Room(mockIo, mockSocket, 'video-test-room');
    });

    it('should handle load-video event', () => {
      const videoData = {
        videoId: { videoId: 'abc123', title: 'Test Video' },
      };
      const data = {
        state: 'load-video',
        ...videoData,
      };

      room.handleVideoEvent(data, 'video-test-room');

      const state = Room.getVideoState('video-test-room');
      expect(state.videoId).toEqual(videoData.videoId);
      expect(state.currentTime).toBe(0);
      expect(state.isPlaying).toBe(false);
      expect(mockSocket.broadcast.emit).toHaveBeenCalledWith('receive-event', data);
    });

    it('should handle play event', () => {
      const data = {
        state: 'play',
        currentTime: 45.5,
        username: 'testuser',
      };

      room.handleVideoEvent(data, 'play-test-room');

      const state = Room.getVideoState('play-test-room');
      expect(state.currentTime).toBe(45.5);
      expect(state.isPlaying).toBe(true);
      expect(mockSocket.broadcast.emit).toHaveBeenCalledWith('receive-event', data);
    });

    it('should handle pause event', () => {
      // First play to set isPlaying to true
      room.handleVideoEvent({ state: 'play', currentTime: 30 }, 'pause-test-room');

      const data = {
        state: 'pause',
        currentTime: 60.5,
        username: 'testuser',
      };

      room.handleVideoEvent(data, 'pause-test-room');

      const state = Room.getVideoState('pause-test-room');
      expect(state.currentTime).toBe(60.5);
      expect(state.isPlaying).toBe(false);
      expect(mockSocket.broadcast.emit).toHaveBeenCalledWith('receive-event', data);
    });

    it('should handle seek event', () => {
      const data = {
        state: 'seek',
        newTime: 300,
        value: 50,
        username: 'testuser',
      };

      room.handleVideoEvent(data, 'seek-test-room');

      const state = Room.getVideoState('seek-test-room');
      expect(state.currentTime).toBe(300);
      expect(mockSocket.broadcast.emit).toHaveBeenCalledWith('receive-event', data);
    });
  });

  describe('sendVideoState', () => {
    let room;

    beforeEach(() => {
      room = new Room(mockIo, mockSocket, 'sync-test-room');
    });

    it('should send current video state to the client', () => {
      // Set up video state
      Room.updateVideoState('sync-room', {
        videoId: 'test-video-id',
        currentTime: 100,
        isPlaying: false,
        videos: [{ videoId: 'test-video-id', title: 'Test' }],
      });

      room.sendVideoState('sync-room');

      expect(mockSocket.emit).toHaveBeenCalledWith('video-state-sync', expect.objectContaining({
        videoId: 'test-video-id',
        currentTime: 100,
        isPlaying: false,
        videos: expect.any(Array),
      }));
    });

    it('should calculate elapsed time for playing videos', async () => {
      // Set up a playing video state
      Room.updateVideoState('playing-room', {
        videoId: 'test-video',
        currentTime: 100,
        isPlaying: true,
      });

      // Wait a small amount of time
      await new Promise(resolve => setTimeout(resolve, 100));

      room.sendVideoState('playing-room');

      const emitCall = mockSocket.emit.mock.calls[0];
      const sentState = emitCall[1];

      // Current time should have increased
      expect(sentState.currentTime).toBeGreaterThan(100);
    });
  });

  describe('handleVideoListEvent', () => {
    let room;

    beforeEach(() => {
      room = new Room(mockIo, mockSocket, 'list-test-room');
    });

    it('should add video to the list', () => {
      const video = { videoId: 'new-video', title: 'New Video' };
      const data = {
        type: 'add-video',
        video,
        roomId: 'list-room',
      };

      room.handleVideoListEvent(data);

      const state = Room.getVideoState('list-room');
      expect(state.videos).toContain(video);
      expect(mockSocket.broadcast.emit).toHaveBeenCalledWith('update_video_list', expect.objectContaining({
        type: 'add-video',
        video,
        videos: expect.arrayContaining([video]),
      }));
    });

    it('should set first video as current video', () => {
      const video = { videoId: 'first-video', title: 'First Video' };
      const data = {
        type: 'add-video',
        video,
        roomId: 'first-video-room',
      };

      room.handleVideoListEvent(data);

      const state = Room.getVideoState('first-video-room');
      expect(state.videoId).toEqual(video);
    });

    it('should remove video from the list', () => {
      const video = { videoId: 'remove-me', title: 'Remove Me' };

      // First add the video
      room.handleVideoListEvent({
        type: 'add-video',
        video,
        roomId: 'remove-room',
      });

      // Then remove it
      room.handleVideoListEvent({
        type: 'remove-video',
        video,
        roomId: 'remove-room',
      });

      const state = Room.getVideoState('remove-room');
      expect(state.videos).not.toContain(video);
    });
  });

  describe('joinRoom', () => {
    let room;

    beforeEach(() => {
      room = new Room(mockIo, mockSocket, 'join-test-room');
    });

    it('should set username on socket data', () => {
      room.joinRoom({ username: 'TestUser' });

      expect(mockSocket.data.username).toBe('TestUser');
    });

    it('should broadcast join message to other users', () => {
      room.joinRoom({ username: 'NewUser' });

      expect(mockSocket.broadcast.emit).toHaveBeenCalledWith(
        'MSG:receive-message',
        expect.objectContaining({
          type: 'admin',
          content: 'NewUser has joined the room',
          username: 'NewUser',
        })
      );
    });

    it('should broadcast user count update', () => {
      room.joinRoom({ username: 'AnotherUser' });

      expect(mockSocket.broadcast.emit).toHaveBeenCalledWith(
        'update_user_count',
        expect.any(Number)
      );
    });
  });

  describe('getClientCount', () => {
    it('should return the client count from io.engine', () => {
      mockIo.engine.clientsCount = 5;
      const room = new Room(mockIo, mockSocket, 'count-test-room');

      expect(room.getClientCount()).toBe(5);
    });
  });
});
