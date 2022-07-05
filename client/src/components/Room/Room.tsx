import React from 'react';
import { Box, Grid } from '@mui/material';
import { VideoPlayer, AddVideoBar, SideList, PageContainer } from '@components';
import { isValidYTLink, ifArrayContains, loadYTScript } from '@helpers';
import { UserContext } from '@context';
import { useGetWebSocket, useGetUserCount } from '@hooks';
import { useSnackbar } from 'notistack';

const Room = () => {
  const { enqueueSnackbar } = useSnackbar();

  const { user } = React.useContext<any>(UserContext);
  const [videos, setVideos] = React.useState<string[] | []>([]);
  const [messages, setMessages] = React.useState([]);
  const { socket, roomId } = useGetWebSocket(user);
  const { usersCount } = useGetUserCount(socket);

  // Load YT IFrame Player script into html
  React.useEffect(() => {
    // @ts-ignore
    if (!window.YT) {
      // @ts-ignore
      loadYTScript();
    }
  }, []);

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

        socket.emit('video-list-event', data);
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
    socket.emit('video-list-event', data);
  };

  const sendMessage = (data: any) => {
    const { content } = data;
    const messageData = {
      type: 'chat',
      content,
      created_at: new Date().getTime(),
      username: user,
    };

    // @ts-ignore
    setMessages((m) => [...m, messageData]);
    // @ts-ignore
    socket.emit('send-message', messageData);
  };

  const appendMessage = (message: string) => {
    // @ts-ignore
    setMessages((m) => [...m, message]);
  };

  // * Socket Event Listener
  React.useEffect(() => {
    if (!socket) return;
    // @ts-ignore
    socket.on('receive-message', (data) => {
      // @ts-ignore
      setMessages((m) => [...m, data]);
    });

    // @ts-ignore
    return () => socket.off('receive-message');
  }, [socket]);

  // * Socket Event Listener
  React.useEffect(() => {
    if (!socket) return;
    // @ts-ignore
    socket.on('update-video-list', (data) => {
      console.log(data);

      if (data.type === 'add-video') {
        setVideos(data.videos);
      } else if (data.type === 'remove-video') {
        setVideos(data.videos);
      } else setVideos(data.videos);
    });
    // @ts-ignore

    return () => socket.off('update-video-list');
  }, [socket]);

  // * Socket Event Listener
  // * When new user joins chat
  React.useEffect(() => {
    if (!socket) return;

    // @ts-ignore
    socket.on('user-updated', (data: { type: string; user: string; username: string }) => {
      const content =
        data.type === 'user-join' ? `${data.username} has joined` : `${data.user} changed name to ${data.username}`;
      const message = {
        type: data.type,
        content,
        created_at: new Date().getTime(),
        username: data.username,
      };

      // @ts-ignore
      // setMessages((m) => [...m, message]);
      appendMessage(message);
    });
    // @ts-ignore
    // return () => socket.off('user-join');
  }, [socket]);

  return (
    <PageContainer>
      <>
        <AddVideoBar addVideoToList={addVideoToList} />
        <Box sx={{ flexGrow: 1 }}>
          <Grid container spacing={2} style={{ width: '100%' }}>
            {/* <Grid container direction="row" justify="space-evenly"> */}
            <Grid style={{ width: '70%' }}>
              <VideoPlayer curVideo={videos[0]} socket={socket} addMessage={appendMessage} username={user} />
            </Grid>
            <Grid style={{ width: '30%' }}>
              <SideList
                videos={videos}
                removeVideoFromList={removeVideoFromList}
                messages={messages}
                sendMessage={sendMessage}
                socket={socket}
                usersCount={usersCount}
              />
            </Grid>
          </Grid>
        </Box>
      </>
    </PageContainer>
  );
};

export default Room;
