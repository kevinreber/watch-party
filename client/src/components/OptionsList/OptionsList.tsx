import React from 'react';
import {
	List,
	ListItem,
	ListItemText,
	ListItemAvatar,
	Avatar,
	CircularProgress,
} from '@material-ui/core';
import './OptionsList.css';

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
			<ListItem
				key={option.videoId}
				onClick={() => handleClick(option)}
				className="Options-Item">
				<ListItemAvatar>
					<Avatar variant="square" alt={option.img} src={option.img} />
				</ListItemAvatar>
				<ListItemText primary={option.name} secondary={option.description} />
			</ListItem>
		))
	) : (
		<ListItem className="Options-Item">
			<em className="no-matches">No Matches</em>
		</ListItem>
	);

	return (
		<List className="Options-List">
			{isLoading ? (
				<ListItem className="Options-Item">
					<CircularProgress />
				</ListItem>
			) : (
				OptionsList
			)}
		</List>
	);
};

export default OptionsList;
