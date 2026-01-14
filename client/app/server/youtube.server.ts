// YouTube API integration
// Note: Using dynamic import for youtube-api since it's a CommonJS module

interface YouTubeVideoResult {
  videoId: string;
  channel: string;
  description: string;
  url: string;
  name: string;
  img: string;
}

interface YouTubeSearchItem {
  id: { videoId: string };
  snippet: {
    channelTitle: string;
    description: string;
    title: string;
    thumbnails: {
      default: { url: string };
    };
  };
}

const YOUTUBE_BASE_URL = "https://www.youtube.com/watch?v=";

// Re-formats data for each YouTube video
const mapYoutubeSearchResult = (video: YouTubeSearchItem): YouTubeVideoResult => {
  return {
    videoId: video.id.videoId,
    channel: video.snippet.channelTitle,
    description: video.snippet.description,
    url: `${YOUTUBE_BASE_URL}${video.id.videoId}`,
    name: video.snippet.title,
    img: video.snippet.thumbnails.default.url,
  };
};

export const searchYoutube = async (query: string): Promise<YouTubeVideoResult[]> => {
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    console.warn("YOUTUBE_API_KEY not configured, returning mock data");
    return getMockYoutubeResults(query);
  }

  try {
    // Using the YouTube Data API v3 directly via fetch
    const params = new URLSearchParams({
      part: "snippet",
      type: "video",
      maxResults: "5",
      q: query,
      key: apiKey,
    });

    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?${params}`
    );

    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.items) {
      return data.items.map(mapYoutubeSearchResult);
    }

    return [];
  } catch (error) {
    console.error("YouTube search error:", error);
    return getMockYoutubeResults(query);
  }
};

// Mock data fallback when API key is not available
function getMockYoutubeResults(query: string): YouTubeVideoResult[] {
  return [
    {
      videoId: "dQw4w9WgXcQ",
      channel: "Rick Astley",
      description: `Search result for: ${query}`,
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      name: "Rick Astley - Never Gonna Give You Up",
      img: "https://i.ytimg.com/vi/dQw4w9WgXcQ/default.jpg",
    },
    {
      videoId: "9bZkp7q19f0",
      channel: "officialpsy",
      description: `Search result for: ${query}`,
      url: "https://www.youtube.com/watch?v=9bZkp7q19f0",
      name: "PSY - GANGNAM STYLE",
      img: "https://i.ytimg.com/vi/9bZkp7q19f0/default.jpg",
    },
  ];
}
