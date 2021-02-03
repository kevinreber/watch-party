// Dependencies
import React, { useState, useCallback, memo } from 'react';

// MUI
import { IconButton } from '@material-ui/core';
import { AddToQueue } from '@material-ui/icons';

interface BarTypes {
	addVideoToList: Function;
}

const AddVideoBar = ({ addVideoToList }: BarTypes): JSX.Element => {
	const [url, setUrl] = useState('https://www.youtube.com/watch?v=OHviieMFY0c');

	const handleChange = useCallback((e: any) => {
		setUrl(e.target.value);
	}, []);

	const handleSubmit = useCallback(
		(e: any) => {
			if (e.keyCode === 13 || e.type === 'submit') {
				e.preventDefault();
				addVideoToList(url);
				setUrl('');
			}
		},
		[url, addVideoToList]
	);

	return (
		<form onSubmit={handleSubmit}>
			<input
				name="id"
				id="video-id"
				value={url}
				onChange={handleChange}
				onKeyDown={handleSubmit}
			/>
			<IconButton type="submit" aria-label="add to queue">
				<AddToQueue />
			</IconButton>
		</form>
	);
};

export default memo(AddVideoBar);
