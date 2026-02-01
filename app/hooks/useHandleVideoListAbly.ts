import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router";
import type { RealtimeChannel, Message as AblyMessage } from "ably";
import { useSnackbar } from "notistack";
import { isValidYTLink, ifArrayContains } from "~/utils/helpers";

interface Video {
  videoId: string;
  url: string;
  name: string;
  channel?: string;
  description?: string;
  img?: string;
}

interface VideoListEvent {
  type: "add-video" | "remove-video";
  video: Video;
  videos: Video[];
  senderId?: string;
}

interface InitialVideoData {
  currentVideo?: Video | null;
  videoQueue?: Video[];
}

export const useHandleVideoListAbly = (
  channel: RealtimeChannel | null,
  clientId: string | undefined,
  initialData?: InitialVideoData
) => {
  const { roomId } = useParams();
  const [videos, setVideos] = useState<Video[]>([]);
  const [hasInitialized, setHasInitialized] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  // Fetch initial video state from API
  const fetchInitialState = useCallback(async () => {
    if (!roomId) return;

    try {
      const response = await fetch(`/api/video-state?roomId=${roomId}`);
      if (response.ok) {
        const state = await response.json();
        if (state.videos && state.videos.length > 0) {
          setVideos(state.videos);
          enqueueSnackbar("Video queue synced", { variant: "info" });
        }
      }
    } catch (err) {
      console.error("Failed to fetch initial video state:", err);
    }
  }, [roomId, enqueueSnackbar]);

  // Initialize from Convex data when available (preferred source of truth)
  useEffect(() => {
    if (hasInitialized) return;

    if (initialData) {
      const initialVideos: Video[] = [];

      // Add current video first if it exists
      if (initialData.currentVideo) {
        initialVideos.push(initialData.currentVideo);
      }

      // Add queue videos (excluding current if it's already added)
      if (initialData.videoQueue && initialData.videoQueue.length > 0) {
        for (const video of initialData.videoQueue) {
          if (!initialVideos.some((v) => v.videoId === video.videoId)) {
            initialVideos.push(video);
          }
        }
      }

      if (initialVideos.length > 0) {
        setVideos(initialVideos);
        setHasInitialized(true);

        return;
      }
    }

    // Fallback to API fetch if no Convex data
    if (channel && roomId && !hasInitialized) {
      fetchInitialState().then(() => setHasInitialized(true));
    }
  }, [channel, roomId, initialData, hasInitialized, fetchInitialState]);

  const addVideoToList = useCallback(
    async (video: Video) => {
      if (!channel || !roomId) return;

      if (isValidYTLink(video.url)) {
        if (!ifArrayContains(videos, video)) {
          const updatedVideos = [...videos, video];
          setVideos(updatedVideos);

          // Update server state
          try {
            await fetch("/api/video-state", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ roomId, type: "add-video", video }),
            });
          } catch (err) {
            console.error("Failed to update server state:", err);
          }

          // Broadcast to other users
          const event: VideoListEvent = {
            type: "add-video",
            video,
            videos: updatedVideos,
            senderId: clientId,
          };
          channel.publish("video-list-update", event);

          enqueueSnackbar("Video added to queue", { variant: "success" });
        } else {
          enqueueSnackbar("Video already in queue", { variant: "warning" });
        }
      } else {
        enqueueSnackbar("Invalid URL", { variant: "warning" });
      }
    },
    [channel, roomId, videos, clientId, enqueueSnackbar]
  );

  const removeVideoFromList = useCallback(
    async (video: Video) => {
      if (!channel || !roomId) return;

      const filteredVideos = videos.filter((vid) => vid.videoId !== video.videoId);
      setVideos(filteredVideos);

      // Update server state
      try {
        await fetch("/api/video-state", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomId, type: "remove-video", video }),
        });
      } catch (err) {
        console.error("Failed to update server state:", err);
      }

      // Broadcast to other users
      const event: VideoListEvent = {
        type: "remove-video",
        video,
        videos: filteredVideos,
        senderId: clientId,
      };
      channel.publish("video-list-update", event);
    },
    [channel, roomId, videos, clientId]
  );

  // Play next video in queue (remove current video)
  const playNextVideo = useCallback(async () => {
    if (!channel || !roomId || videos.length <= 1) return;

    const currentVideo = videos[0];
    const filteredVideos = videos.slice(1);
    setVideos(filteredVideos);

    // Update server state
    try {
      await fetch("/api/video-state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, type: "remove-video", video: currentVideo }),
      });
    } catch (err) {
      console.error("Failed to update server state:", err);
    }

    // Broadcast to other users
    const event: VideoListEvent = {
      type: "remove-video",
      video: currentVideo,
      videos: filteredVideos,
      senderId: clientId,
    };
    channel.publish("video-list-update", event);

    if (filteredVideos.length > 0) {
      enqueueSnackbar(`Now playing: ${filteredVideos[0].name}`, { variant: "info" });
    }
  }, [channel, roomId, videos, clientId, enqueueSnackbar]);

  // Subscribe to video list updates
  useEffect(() => {
    if (!channel) return;

    const onVideoListUpdate = (message: AblyMessage) => {
      const data = message.data as VideoListEvent;

      // Ignore our own updates
      if (data.senderId === clientId) return;

      console.log("Video list update:", data);
      setVideos(data.videos);
    };

    channel.subscribe("video-list-update", onVideoListUpdate);

    return () => {
      channel.unsubscribe("video-list-update", onVideoListUpdate);
    };
  }, [channel, clientId]);

  return { videos, addVideoToList, removeVideoFromList, playNextVideo };
};
