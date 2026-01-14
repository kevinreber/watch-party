import { useState, useEffect } from "react";
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
        enqueueSnackbar("Video added to Video Queue", { variant: "success" });
      } else {
        enqueueSnackbar("Video already in Video Queue", { variant: "warning" });
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

  return { videos, addVideoToList, removeVideoFromList };
};
