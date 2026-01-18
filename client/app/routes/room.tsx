import { useContext } from "react";
import { useParams } from "react-router";
import { Box, Grid, Typography } from "@mui/material";
import { UserContext } from "~/context/UserContext";
import {
  useGetWebSocket,
  useHandleVideoList,
  useGetUserCount,
  useLoadYouTubeScript,
} from "~/hooks";
import {
  PageContainer,
  VideoPlayer,
  AddVideoBar,
  SideList,
} from "~/components";

export default function Room() {
  const { roomId } = useParams();
  const { user } = useContext(UserContext);

  const { socket } = useGetWebSocket(user);
  const { usersCount } = useGetUserCount(socket);
  const { videos, addVideoToList, removeVideoFromList } = useHandleVideoList(socket);

  useLoadYouTubeScript();

  return (
    <PageContainer>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Room: {roomId}
      </Typography>

      <AddVideoBar addVideoToList={addVideoToList} />

      <Box sx={{ flexGrow: 1 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <VideoPlayer curVideo={videos[0]} />
          </Grid>
          <Grid item xs={12} md={4}>
            <SideList
              videos={videos}
              removeVideoFromList={removeVideoFromList}
              socket={socket}
              usersCount={usersCount}
            />
          </Grid>
        </Grid>
      </Box>
    </PageContainer>
  );
}
