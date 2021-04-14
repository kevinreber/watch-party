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
	removeVideo: Function;
}

const WatchList = ({ videos, removeVideo }: Props): JSX.Element => {
	return (
		<List dense={false}>
			{videos.length > 0 ? (
				videos.map((video: string) => (
					<React.Fragment key={video}>
						<ListItem>
							<ListItemAvatar>
								<Avatar>
									<FolderIcon />
								</Avatar>
							</ListItemAvatar>
							<ListItemText primary={video} secondary={'Secondary text'} />
							<ListItemSecondaryAction>
								<IconButton
									edge="end"
									aria-label="remove"
									onClick={() => removeVideo(video)}>
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
