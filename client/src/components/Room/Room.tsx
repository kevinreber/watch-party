import React from 'react';
import { Box, Grid } from '@mui/material';
import { VideoPlayer, AddVideoBar, SideList, PageContainer } from '@components';
import { loadYTScript } from '@helpers';
import { UserContext } from '@context';
import { useGetWebSocket, useGetUserCount, useHandleMessages, useHandleVideoList } from '@hooks';
import { SOCKET_CLIENT_LISTENER } from '@socket-client';

const Room = () => {
  const { user } = React.useContext<any>(UserContext);
  const { socket, roomId } = useGetWebSocket(user);
  const { usersCount } = useGetUserCount(socket);
  const { messages, appendMessage, sendMessage } = useHandleMessages(socket, user);
  const { videos, addVideoToList, removeVideoFromList } = useHandleVideoList(socket);

  // Load YT IFrame Player script into html
  React.useEffect(() => {
    // @ts-ignore
    if (!window.YT) {
      // @ts-ignore
      loadYTScript();
    }
  }, []);

  // * Socket Event Listener
  // * When new user joins chat
  React.useEffect(() => {
    if (!socket) return;

    // @ts-ignore
    socket.on(SOCKET_CLIENT_LISTENER.userUpdated, (data: { type: string; user: string; username: string }) => {
      const content =
        data.type === 'user-join' ? `${data.username} has joined` : `${data.user} changed name to ${data.username}`;
      const message = {
        type: data.type,
        content,
        created_at: new Date().getTime(),
        username: data.username,
      };

      // @ts-ignore
      appendMessage(message);
    });

    // @ts-ignore
    return () => socket.off(SOCKET_CLIENT_LISTENER.userUpdated);
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
