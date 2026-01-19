import React from 'react';
import { useSnackbar } from 'notistack';
import { isValidYTLink, ifArrayContains } from '@helpers';
import { SOCKET_CLIENT_EMITTER, SOCKET_CLIENT_LISTENER } from '@socket-client';

export const useHandleVideoList = (socket: SocketIOClient.Socket) => {
  const [videos, setVideos] = React.useState<string[]>([]);
  const { enqueueSnackbar } = useSnackbar();

  const addVideoToList = (video: any) => {
    if (isValidYTLink(video.url)) {
      // @ts-ignore
      if (!ifArrayContains(videos, video)) {
        const updatedVideos = [...videos, video];

        setVideos(updatedVideos);

        const data = {
          type: 'add-video',
          video,
        };

        socket.emit(SOCKET_CLIENT_EMITTER.videoListEvent, data);
        enqueueSnackbar('Video added to Video Queue', { variant: 'success' });
      } else {
        enqueueSnackbar('Video already in Video Queue', { variant: 'warning' });
      }
    } else {
      enqueueSnackbar('Invalid URL', { variant: 'warning' });
    }
  };

  const removeVideoFromList = (video: string) => {
    const filteredVideos = videos.filter((vid) => vid !== video);

    setVideos(filteredVideos);
    const data = {
      type: 'remove-video',
      video,
    };

    // emit event
    socket.emit(SOCKET_CLIENT_EMITTER.videoListEvent, data);
  };

  // * Socket Event Listener
  // @ts-ignore
  React.useEffect(() => {
    if (!socket) return;
    // @ts-ignore
    socket.on(SOCKET_CLIENT_LISTENER.updateVideoList, (data) => {
      console.log(data);

      if (data.type === 'add-video') {
        setVideos(data.videos);
      } else if (data.type === 'remove-video') {
        setVideos(data.videos);
      } else setVideos(data.videos);
    });

    return () => socket.off(SOCKET_CLIENT_LISTENER.updateVideoList);
  }, [socket]);

  return { videos, addVideoToList, removeVideoFromList };
};
