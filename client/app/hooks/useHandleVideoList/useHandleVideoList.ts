import { useState, useEffect } from 'react';
import type { Socket } from 'socket.io-client';
import { useSnackbar } from 'notistack';
import { isValidYTLink, ifArrayContains } from '@helpers';
import { SOCKET_CLIENT_EMITTER, SOCKET_CLIENT_LISTENER } from '@socket-client';
import { VideoTypes } from '@types';

export const useHandleVideoList = (socket: Socket | undefined) => {
  const [videos, setVideos] = useState<VideoTypes[]>([]);
  const { enqueueSnackbar } = useSnackbar();

  const addVideoToList = (video: VideoTypes) => {
    if (isValidYTLink(video.url)) {
      if (!ifArrayContains(videos, video)) {
        const updatedVideos = [...videos, video];

        setVideos(updatedVideos);

        const data = {
          type: 'add-video',
          video,
        };

        socket?.emit(SOCKET_CLIENT_EMITTER.videoListEvent, data);
        enqueueSnackbar('Video added to Video Queue', { variant: 'success' });
      } else {
        enqueueSnackbar('Video already in Video Queue', { variant: 'warning' });
      }
    } else {
      enqueueSnackbar('Invalid URL', { variant: 'warning' });
    }
  };

  const removeVideoFromList = (video: VideoTypes) => {
    const filteredVideos = videos.filter((vid) => vid.videoId !== video.videoId);

    setVideos(filteredVideos);
    const data = {
      type: 'remove-video',
      video,
    };

    // emit event
    socket?.emit(SOCKET_CLIENT_EMITTER.videoListEvent, data);
  };

  // Socket Event Listener
  useEffect(() => {
    if (!socket) return;

    socket.on(SOCKET_CLIENT_LISTENER.updateVideoList, (data: { type: string; videos: VideoTypes[] }) => {
      console.log(data);
      setVideos(data.videos);
    });

    return () => {
      socket.off(SOCKET_CLIENT_LISTENER.updateVideoList);
    };
  }, [socket]);

  return { videos, addVideoToList, removeVideoFromList };
};
