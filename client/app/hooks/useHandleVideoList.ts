import { useState, useEffect, useCallback } from "react";
import type { Socket } from "socket.io-client";
import { useSnackbar } from "notistack";
import { isValidYTLink, ifArrayContains } from "~/utils/helpers";
import { SOCKET_CLIENT_EMITTER, SOCKET_CLIENT_LISTENER } from "~/utils/socket-client";

interface Video {
  videoId: string;
  url: string;
  name: string;
  channel?: string;
  description?: string;
  img?: string;
}

export const useHandleVideoList = (socket: Socket | null) => {
  const [videos, setVideos] = useState<Video[]>([]);
  const { enqueueSnackbar } = useSnackbar();

  const addVideoToList = (video: Video) => {
    if (!socket) return;

    if (isValidYTLink(video.url)) {
      if (!ifArrayContains(videos, video)) {
        const updatedVideos = [...videos, video];
        setVideos(updatedVideos);

        const data = {
          type: "add-video",
          video,
        };

        socket.emit(SOCKET_CLIENT_EMITTER.videoListEvent, data);
        enqueueSnackbar("Video added to queue", { variant: "success" });
      } else {
        enqueueSnackbar("Video already in queue", { variant: "warning" });
      }
    } else {
      enqueueSnackbar("Invalid URL", { variant: "warning" });
    }
  };

  const removeVideoFromList = (video: Video) => {
    if (!socket) return;

    const filteredVideos = videos.filter((vid) => vid.videoId !== video.videoId);
    setVideos(filteredVideos);

    const data = {
      type: "remove-video",
      video,
    };

    socket.emit(SOCKET_CLIENT_EMITTER.videoListEvent, data);
  };

  // Play next video in queue (remove current video)
  const playNextVideo = useCallback(() => {
    if (!socket || videos.length <= 1) return;

    const currentVideo = videos[0];
    const filteredVideos = videos.slice(1);
    setVideos(filteredVideos);

    const data = {
      type: "remove-video",
      video: currentVideo,
    };

    socket.emit(SOCKET_CLIENT_EMITTER.videoListEvent, data);

    if (filteredVideos.length > 0) {
      enqueueSnackbar(`Now playing: ${filteredVideos[0].name}`, { variant: "info" });
    }
  }, [socket, videos, enqueueSnackbar]);

  // Socket Event Listener - Update video list
  useEffect(() => {
    if (!socket) return;

    const onUpdateVideoList = (data: { type: string; videos: Video[] }) => {
      console.log("Video list update:", data);
      setVideos(data.videos);
    };

    socket.on(SOCKET_CLIENT_LISTENER.updateVideoList, onUpdateVideoList);

    return () => {
      socket.off(SOCKET_CLIENT_LISTENER.updateVideoList, onUpdateVideoList);
    };
  }, [socket]);

  return { videos, addVideoToList, removeVideoFromList, playNextVideo };
};
