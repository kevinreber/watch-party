import React from 'react';

// MUI
import {
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  ListItemSecondaryAction,
} from '@material-ui/core';
import { Delete as DeleteIcon, Folder as FolderIcon } from '@material-ui/icons';

interface Props {
  videos: string[];
  removeVideo: any;
}

const WatchList = ({ videos, removeVideo }: Props): JSX.Element => {
  return (
    <List dense={false}>
      {videos.length > 0 ? (
        videos.map((video: any) => (
          <React.Fragment key={video.videoId}>
            <ListItem>
              <ListItemAvatar>
                <Avatar src={video.img} alt={video.name}>
                  {/* <FolderIcon /> */}
                </Avatar>
              </ListItemAvatar>
              <ListItemText primary={video.name} secondary={video.description} />
              <ListItemSecondaryAction>
                <IconButton edge="end" aria-label="remove" onClick={() => removeVideo(video)}>
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          </React.Fragment>
        ))
      ) : (
        <ListItem>
          <ListItemText primary="Empty List" />
        </ListItem>
      )}
    </List>
  );
};

export default WatchList;
