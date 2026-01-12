import { useContext } from "react";
import { Box, Grid } from "@mui/material";

import {
  VideoPlayer,
  AddVideoBar,
  SideList,
  PageContainer,
} from "@components";
import { UserContext } from "@context";
import {
  useGetUserCount,
  useGetWebSocket,
  useHandleMessages,
  useHandleVideoList,
  useLoadYouTubeScript,
} from "@hooks";
import type { Route } from "./+types/room";

export function meta({ params }: Route.MetaArgs) {
  return [
    { title: `Room: ${params.roomId} | Watch Party` },
    { name: "description", content: "Watch videos together in real-time" },
  ];
}

export default function Room() {
  const { user } = useContext<any>(UserContext);

  const { socket } = useGetWebSocket(user);
  const { usersCount } = useGetUserCount(socket);
  const { appendMessage } = useHandleMessages(socket, user);
  const { videos, addVideoToList, removeVideoFromList } =
    useHandleVideoList(socket);

  useLoadYouTubeScript();

  return (
    <PageContainer>
      <>
        <AddVideoBar addVideoToList={addVideoToList} />
        <Box sx={{ flexGrow: 1 }}>
          <Grid container spacing={2} style={{ width: "100%" }}>
            <Grid style={{ width: "70%" }}>
              <VideoPlayer
                curVideo={videos[0]}
                socket={socket}
                addMessage={appendMessage}
                username={user}
              />
            </Grid>
            <Grid style={{ width: "30%" }}>
              <SideList
                videos={videos}
                removeVideoFromList={removeVideoFromList}
                socket={socket}
                usersCount={usersCount}
              />
            </Grid>
          </Grid>
        </Box>
      </>
    </PageContainer>
  );
}
