// Dependencies
import React, { useState, useCallback, memo } from 'react';
import Api from '../../api/api';

// MUI
import { IconButton } from '@material-ui/core';
import { AddToQueue } from '@material-ui/icons';

interface BarTypes {
	addVideoToList: Function;
}

const AddVideoBar = ({ addVideoToList }: BarTypes): JSX.Element => {
	const [search, setSearch] = useState('https://www.youtube.com/watch?v=OHviieMFY0c');

	const handleChange = async (e: any) => {
		setSearch(e.target.value);
		const results = await Api.searchForYoutubeVideos(e.target.value);
	};

	const handleSubmit = useCallback(
		(e: any) => {
			if (e.keyCode === 13 || e.type === 'submit') {
				e.preventDefault();
				addVideoToList(search);
				setSearch('');
			}
		},
		[search, addVideoToList]
	);

	return (
		<form onSubmit={handleSubmit}>
			<input
				name="id"
				id="video-id"
				value={search}
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
