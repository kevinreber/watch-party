import React from 'react';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import Avatar from '@material-ui/core/Avatar';
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
}

const OptionsList = ({
	options,
	handleClick,
}: OptionListTypes): JSX.Element => {
	return (
		<List>
			{options.length ? (
				options.map((option) => (
					<ListItem key={option.videoId} onClick={() => handleClick(option)}>
						<ListItemAvatar>
							<Avatar variant="square" alt={option.img} src={option.img} />
						</ListItemAvatar>
						<ListItemText
							primary={option.name}
							secondary={option.description}
						/>
					</ListItem>
				))
			) : (
				<ListItem>
					<em>No Matches</em>
				</ListItem>
			)}
		</List>
	);
};

export default OptionsList;
