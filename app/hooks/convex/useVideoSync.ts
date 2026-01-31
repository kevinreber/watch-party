import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

export function useVideoSync(roomId: Id<"rooms"> | null) {
  const videoState = useQuery(
    api.videoSync.getVideoState,
    roomId ? { roomId } : "skip"
  );

  const syncVideoState = useMutation(api.videoSync.syncVideoState);
  const addToQueue = useMutation(api.videoSync.addToQueue);
  const removeFromQueue = useMutation(api.videoSync.removeFromQueue);
  const reorderQueue = useMutation(api.videoSync.reorderQueue);
  const clearQueue = useMutation(api.videoSync.clearQueue);
  const playNext = useMutation(api.videoSync.playNext);
  const setCurrentVideo = useMutation(api.videoSync.setCurrentVideo);

  const play = async (currentTime: number) => {
    if (!roomId) return;
    await syncVideoState({ roomId, type: "play", currentTime });
  };

  const pause = async (currentTime: number) => {
    if (!roomId) return;
    await syncVideoState({ roomId, type: "pause", currentTime });
  };

  const seek = async (currentTime: number) => {
    if (!roomId) return;
    await syncVideoState({ roomId, type: "seek", currentTime });
  };

  const changeVideo = async (
    video: {
      videoId: string;
      url: string;
      name: string;
      channel?: string;
      img?: string;
    },
    currentTime = 0
  ) => {
    if (!roomId) return;
    await syncVideoState({ roomId, type: "video-change", currentTime, video });
  };

  return {
    videoState,
    isLoading: videoState === undefined,
    // Actions
    play,
    pause,
    seek,
    changeVideo,
    addToQueue: (video: {
      videoId: string;
      url: string;
      name: string;
      channel?: string;
      img?: string;
    }) => roomId && addToQueue({ roomId, video }),
    removeFromQueue: (videoId: string) =>
      roomId && removeFromQueue({ roomId, videoId }),
    reorderQueue: (videos: Array<{
      videoId: string;
      url: string;
      name: string;
      channel?: string;
      img?: string;
    }>) => roomId && reorderQueue({ roomId, videos }),
    clearQueue: () => roomId && clearQueue({ roomId }),
    playNext: () => roomId && playNext({ roomId }),
    setCurrentVideo: (video: {
      videoId: string;
      url: string;
      name: string;
      channel?: string;
      img?: string;
    }) => roomId && setCurrentVideo({ roomId, video }),
  };
}
