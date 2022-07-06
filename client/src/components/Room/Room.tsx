import React from 'react';
import { Box, Grid } from '@mui/material';
import { VideoPlayer, AddVideoBar, SideList, PageContainer } from '@components';
import { UserContext } from '@context';
import { useGetWebSocket, useGetUserCount, useHandleMessages, useHandleVideoList, useLoadYouTubeScript } from '@hooks';

const Room = () => {
  const { user } = React.useContext<any>(UserContext);
  const { socket, roomId } = useGetWebSocket(user);
  const { usersCount } = useGetUserCount(socket);
  const { messages, appendMessage, sendMessage } = useHandleMessages(socket, user);
  const { videos, addVideoToList, removeVideoFromList } = useHandleVideoList(socket);

  useLoadYouTubeScript();

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
