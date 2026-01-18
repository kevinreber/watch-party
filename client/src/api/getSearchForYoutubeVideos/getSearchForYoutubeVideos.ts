import { request } from '@api';
import { VideoTypes } from '@types';

/**
 * Search for YouTube videos
 * @param searchTerm - The search query
 * @returns Promise resolving to array of video results
 */
const getSearchForYoutubeVideos = async (searchTerm: string): Promise<VideoTypes[]> => {
  if (!searchTerm || searchTerm.trim() === '') {
    return [];
  }

  try {
    const results = await request<VideoTypes[]>({
      endpoint: `youtube?q=${encodeURIComponent(searchTerm.trim())}`,
    });
    return results || [];
  } catch (error) {
    console.error('YouTube search error:', error);
    // Return empty array on error rather than crashing
    return [];
  }
};

export default getSearchForYoutubeVideos;
