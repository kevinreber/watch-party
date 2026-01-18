import ReactPlayer from "react-player/youtube";
import { Box, Typography } from "@mui/material";

interface Video {
  videoId: string;
  url: string;
  name: string;
  channel?: string;
  description?: string;
  img?: string;
}

interface VideoPlayerProps {
  curVideo: Video | undefined;
}

export const VideoPlayer = ({ curVideo }: VideoPlayerProps) => {
  if (!curVideo) {
    return (
      <Box
        sx={{
          width: "100%",
          height: "400px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#000",
          color: "#fff",
          borderRadius: 1,
        }}
      >
        <Typography variant="h6">
          Add a video to the queue to start watching
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", aspectRatio: "16/9" }}>
      <ReactPlayer
        url={curVideo.url}
        width="100%"
        height="100%"
        controls
        playing
        config={{
          youtube: {
            playerVars: {
              autoplay: 1,
              modestbranding: 1,
            },
          },
        }}
      />
    </Box>
  );
};
