// Dependencies
import React, { useState, useCallback, memo } from 'react';
import Api from '../../api/api';

// Components
import OptionsList from '../OptionsList/OptionsList';

// MUI
import { IconButton } from '@material-ui/core';
import { AddToQueue } from '@material-ui/icons';

interface BarTypes {
	addVideoToList: Function;
}

const AddVideoBar = ({ addVideoToList }: BarTypes): JSX.Element => {
	const [search, setSearch] = useState(
		'https://www.youtube.com/watch?v=OHviieMFY0c'
	);
	const [options, setOptions] = useState([]);
	const [showOptions, setShowOptions] = useState(false);

	const handleChange = async (e: any) => {
		// if value is not empty
		if (e.target.value) setShowOptions(true);
		else setShowOptions(false);

		setSearch(e.target.value);
		await Api.searchForYoutubeVideos(e.target.value)
			.then((data) => setOptions(data))
			.catch((err) => console.error(err));
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
			{showOptions && <OptionsList options={options} />}
			<IconButton type="submit" aria-label="add to queue">
				<AddToQueue />
			</IconButton>
		</form>
	);
};

export default memo(AddVideoBar);
