import React from 'react';
import { useParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { isValidYTLink, ifArrayContains } from '@helpers';
import { SOCKET_CLIENT_EMITTER, SOCKET_CLIENT_LISTENER } from '@socket-client';

export const useHandleVideoList = (socket: SocketIOClient.Socket) => {
  const [videos, setVideos] = React.useState<string[]>([]);
  const { enqueueSnackbar } = useSnackbar();
  const { roomId } = useParams<any>();

  const addVideoToList = (video: any) => {
    if (isValidYTLink(video.url)) {
      // @ts-ignore
      if (!ifArrayContains(videos, video)) {
        const updatedVideos = [...videos, video];

        setVideos(updatedVideos);

        const data = {
          type: 'add-video',
          video,
          roomId,
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
      roomId,
    };

    // emit event
    socket.emit(SOCKET_CLIENT_EMITTER.videoListEvent, data);
  };

  // * Socket Event Listener for video list updates
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

  // * Socket Event Listener for initial video state sync (when joining room)
  // @ts-ignore
  React.useEffect(() => {
    if (!socket) return;
    // @ts-ignore
    socket.on('video-state-sync', (videoState) => {
      console.log('Received video state sync for video list:', videoState);

      if (videoState && videoState.videos && videoState.videos.length > 0) {
        setVideos(videoState.videos);
        enqueueSnackbar('Video queue synced', { variant: 'info' });
      }
    });

    return () => socket.off('video-state-sync');
  }, [socket, enqueueSnackbar]);

  return { videos, addVideoToList, removeVideoFromList };
};
