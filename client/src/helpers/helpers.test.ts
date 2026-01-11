import { isValidYTLink, ifArrayContains, appendZero, getFormattedTime } from './helpers';

describe('helpers', () => {
  describe('isValidYTLink', () => {
    it('should return video ID for valid YouTube URL', () => {
      expect(isValidYTLink('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    });

    it('should return video ID for short YouTube URL', () => {
      expect(isValidYTLink('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    });

    it('should return null for invalid URL', () => {
      expect(isValidYTLink('https://example.com')).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(isValidYTLink('')).toBeNull();
    });
  });

  describe('ifArrayContains', () => {
    const testArray = [
      { videoId: 'abc123', name: 'Video 1' },
      { videoId: 'def456', name: 'Video 2' },
    ];

    it('should return true if array contains object with matching videoId', () => {
      expect(ifArrayContains(testArray, { videoId: 'abc123' })).toBe(true);
    });

    it('should return false if array does not contain object with matching videoId', () => {
      expect(ifArrayContains(testArray, { videoId: 'xyz789' })).toBe(false);
    });

    it('should return false for empty array', () => {
      expect(ifArrayContains([], { videoId: 'abc123' })).toBe(false);
    });
  });

  describe('appendZero', () => {
    it('should prepend zero for single digit numbers', () => {
      expect(appendZero(5)).toBe('05');
      expect(appendZero(0)).toBe('00');
      expect(appendZero(9)).toBe('09');
    });

    it('should not prepend zero for double digit numbers', () => {
      expect(appendZero(10)).toBe(10);
      expect(appendZero(59)).toBe(59);
    });
  });

  describe('getFormattedTime', () => {
    it('should format time in MM:SS for times under an hour', () => {
      expect(getFormattedTime(65)).toBe('01:05');
      expect(getFormattedTime(0)).toBe('00:00');
      expect(getFormattedTime(599)).toBe('09:59');
    });

    it('should format time in HH:MM:SS for times over an hour', () => {
      expect(getFormattedTime(3661)).toBe('01:01:01');
      expect(getFormattedTime(3600)).toBe('01:00:00');
    });

    it('should prepend minus sign when remaining is true', () => {
      expect(getFormattedTime(65, true)).toBe('-01:05');
      expect(getFormattedTime(3661, true)).toBe('-01:01:01');
    });
  });
});
