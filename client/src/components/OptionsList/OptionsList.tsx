import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import Avatar from '@material-ui/core/Avatar';
import ImageIcon from '@material-ui/icons/Image';
import WorkIcon from '@material-ui/icons/Work';
import BeachAccessIcon from '@material-ui/icons/BeachAccess';
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
					<ListItem
						key={option.videoId}
						onClick={() => handleClick(option.url)}>
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
				<li>
					<em>No Matches</em>
				</li>
			)}
		</List>
	);
};

export default OptionsList;
