import React from 'react';
import {
	List,
	ListItem,
	ListItemText,
	ListItemAvatar,
	Avatar,
	CircularProgress,
} from '@material-ui/core';

interface OptionsTypes {
	videoId: string;
	channel: string;
	description: string;
	url: string;
	name: string;
	img: string;
}

interface OptionListTypes {
	options: OptionsTypes[];
	handleClick: Function;
	isLoading: boolean;
}

const OptionsList = ({
	options,
	handleClick,
	isLoading,
}: OptionListTypes): JSX.Element => {
	// Builds Options List to display
	const OptionsList = options.length ? (
		options.map((option) => (
			<ListItem key={option.videoId} onClick={() => handleClick(option)}>
				<ListItemAvatar>
					<Avatar variant="square" alt={option.img} src={option.img} />
				</ListItemAvatar>
				<ListItemText primary={option.name} secondary={option.description} />
			</ListItem>
		))
	) : (
		<ListItem>
			<em>No Matches</em>
		</ListItem>
	);

	return (
		<List>
			{isLoading ? (
				<ListItem>
					<CircularProgress />
				</ListItem>
			) : (
				OptionsList
			)}
		</List>
	);
};

export default OptionsList;
