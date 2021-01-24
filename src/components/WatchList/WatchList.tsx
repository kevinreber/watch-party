// import React from 'react';

// MUI
import IconButton from '@material-ui/core/IconButton';
import { Delete as DeleteIcon } from '@material-ui/icons';

interface Props {
	videos: string[];
	removeVideo: Function;
}

const WatchList = ({ videos, removeVideo }: Props): JSX.Element => {
	return (
		<ul>
			{videos.length > 0 ? (
				videos.map((video: string) => (
					<>
						<li key={video}>
							{video}
							<IconButton
								aria-label="remove"
								onClick={() => removeVideo(video)}>
								<DeleteIcon />
							</IconButton>
						</li>
					</>
				))
			) : (
				<li>Empty List</li>
			)}
		</ul>
	);
};

export default WatchList;
