import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";

interface Video {
  videoId: string;
  url: string;
  name: string;
  channel?: string;
  description?: string;
  img?: string;
}

interface VideoSyncState {
  isPlaying: boolean;
  currentTime: number;
  videoId: Video | null;
  videos: Video[];
  lastUpdated: number;
}

// Store video sync state per room (in production, use Redis or a database)
const roomVideoStates = new Map<string, VideoSyncState>();

// Get or create video state for a room
function getVideoState(roomId: string): VideoSyncState {
  if (!roomVideoStates.has(roomId)) {
    roomVideoStates.set(roomId, {
      isPlaying: false,
      currentTime: 0,
      videoId: null,
      videos: [],
      lastUpdated: Date.now(),
    });
  }
  return roomVideoStates.get(roomId)!;
}

// GET - Fetch current video state for a room
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const roomId = url.searchParams.get("roomId");

  if (!roomId) {
    return Response.json({ error: "roomId is required" }, { status: 400 });
  }

  const state = getVideoState(roomId);

  // Calculate elapsed time if video is playing
  const stateToSend = { ...state };
  if (state.isPlaying && state.lastUpdated) {
    const elapsedSeconds = (Date.now() - state.lastUpdated) / 1000;
    stateToSend.currentTime = state.currentTime + elapsedSeconds;
  }

  return Response.json(stateToSend);
}

// POST - Update video state for a room
export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const body = await request.json();
  const { roomId, type, currentTime, video, videos } = body;

  if (!roomId) {
    return Response.json({ error: "roomId is required" }, { status: 400 });
  }

  const state = getVideoState(roomId);

  // Handle different update types
  switch (type) {
    case "play":
      state.isPlaying = true;
      state.currentTime = currentTime ?? state.currentTime;
      state.lastUpdated = Date.now();
      break;

    case "pause":
      state.isPlaying = false;
      state.currentTime = currentTime ?? state.currentTime;
      state.lastUpdated = Date.now();
      break;

    case "seek":
      state.currentTime = currentTime ?? state.currentTime;
      state.lastUpdated = Date.now();
      break;

    case "add-video":
      if (video && !state.videos.some((v) => v.videoId === video.videoId)) {
        state.videos.push(video);
        if (state.videos.length === 1) {
          state.videoId = video;
        }
      }
      break;

    case "remove-video":
      if (video) {
        state.videos = state.videos.filter((v) => v.videoId !== video.videoId);
      }
      break;

    case "set-videos":
      if (videos) {
        state.videos = videos;
      }
      break;

    default:
      return Response.json({ error: "Invalid type" }, { status: 400 });
  }

  return Response.json({ success: true, state });
}
