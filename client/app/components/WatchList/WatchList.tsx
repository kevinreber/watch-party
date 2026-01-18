import {
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

interface Video {
  videoId: string;
  url: string;
  name: string;
  channel?: string;
  description?: string;
  img?: string;
}

interface WatchListProps {
  videos: Video[];
  removeVideo: (video: Video) => void;
}

export const WatchList = ({ videos, removeVideo }: WatchListProps) => {
  return (
    <List dense={false}>
      {videos.length > 0 ? (
        videos.map((video) => (
          <ListItem
            key={video.videoId}
            secondaryAction={
              <IconButton
                edge="end"
                aria-label="remove"
                onClick={() => removeVideo(video)}
              >
                <DeleteIcon />
              </IconButton>
            }
          >
            <ListItemAvatar>
              <Avatar src={video.img} alt={video.name} />
            </ListItemAvatar>
            <ListItemText primary={video.name} secondary={video.description} />
          </ListItem>
        ))
      ) : (
        <ListItem>
          <ListItemText primary="Empty List - Add videos to queue" />
        </ListItem>
      )}
    </List>
  );
};
