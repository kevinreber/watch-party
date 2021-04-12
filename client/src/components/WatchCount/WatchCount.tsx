import React from 'react';
import VisibilityIcon from '@material-ui/icons/Visibility';

const WatchCount = ({ usersCount }: { usersCount: number }) => {
	return (
		<>
			{usersCount}
			<VisibilityIcon />
		</>
	);
};

export default WatchCount;
