import getYouTubeID from 'get-youtube-id';

interface VideoItem {
  videoId: string;
  [key: string]: unknown;
}

/**
 * Validates if a URL is a valid YouTube link and returns the video ID
 * @param url - The URL to validate
 * @returns The YouTube video ID or null if invalid
 */
export const isValidYTLink = (url: string): string | null => getYouTubeID(url);

/**
 * Checks if an array contains an object with a matching videoId
 * @param arr - Array of video objects
 * @param data - Object with videoId to search for
 * @returns True if found, false otherwise
 */
export const ifArrayContains = (arr: VideoItem[], data: VideoItem): boolean => {
  if (!arr || arr.length === 0) return false;

  return arr.some((obj) => obj.videoId === data.videoId);
};

/**
 * Prepends a zero to single digit numbers
 * @param num - Number to format
 * @returns Formatted string or number
 */
export const appendZero = (num: number): number | string => (num < 10 ? `0${num}` : num);

/**
 * Formats time in seconds to a readable time string
 * @param time - Time in seconds
 * @param remaining - Whether this is remaining time (adds minus sign)
 * @returns Formatted time string (MM:SS or HH:MM:SS)
 */
export const getFormattedTime = (time: number, remaining = false): string => {
  const dateTime = new Date(0, 0, 0, 0, 0, time, 0);

  const dateTimeH = appendZero(dateTime.getHours());
  const dateTimeM = appendZero(dateTime.getMinutes());
  const dateTimeS = appendZero(dateTime.getSeconds());
  const minus = remaining ? '-' : '';

  return dateTimeH > 0
    ? `${minus}${dateTimeH}:${dateTimeM}:${dateTimeS}`
    : `${minus}${dateTimeM}:${dateTimeS}`;
};

// Track if YouTube script has been loaded
let ytScriptLoaded = false;

/**
 * Loads the YouTube IFrame API script
 * Ensures the script is only loaded once
 */
export const loadYTScript = (): void => {
  // Prevent duplicate script loading
  if (ytScriptLoaded || document.querySelector('script[src*="youtube.com/iframe_api"]')) {
    return;
  }

  const tag = document.createElement('script');
  tag.src = 'https://www.youtube.com/iframe_api';

  const firstScriptTag = document.getElementsByTagName('script')[0];
  if (firstScriptTag?.parentNode) {
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    ytScriptLoaded = true;
    console.log('YouTube IFrame API script loaded');
  }
};
