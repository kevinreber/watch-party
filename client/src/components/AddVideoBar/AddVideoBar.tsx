// Dependencies
import React, { useState, useCallback, memo } from 'react';
import Api from '../../api/api';
import './AddVideoBar.css';

// Components
import OptionsList from '../OptionsList/OptionsList';
import { debounce } from '../../utils';

// MUI
import { IconButton, Avatar, ListItemText } from '@material-ui/core';
import { AddToQueue } from '@material-ui/icons';

const VIDEO_INITIAL_STATE = {
	videoId: '',
	channel: '',
	description: '',
	url: '',
	name: '',
	img: '',
};

interface VideoTypes {
	videoId: string;
	channel: string;
	description: string;
	url: string;
	name: string;
	img: string;
}
interface BarTypes {
	addVideoToList: Function;
}

const AddVideoBar = ({ addVideoToList }: BarTypes): JSX.Element => {
	const [search, setSearch] = useState(
		'https://www.youtube.com/watch?v=OHviieMFY0c'
	);
	const [video, setVideo] = useState(VIDEO_INITIAL_STATE);

	const [options, setOptions] = useState([]);
	const [showOptions, setShowOptions] = useState(false);
	const [isLoadingOptions, setIsLoadingOptions] = useState(false);

	let debounced: any = null;

	const handleChange = (e: any) => {
		// if value is not empty
		if (e.target.value) setShowOptions(true);
		else setShowOptions(false);

		setSearch(e.target.value);
		if (!debounced) {
			debounced = debounce(async () => {
				setIsLoadingOptions(true);
				await Api.searchForYoutubeVideos(e.target.value)
					.then((data) => setOptions(data))
					.catch((err) => console.error(err))
					.finally(() => setIsLoadingOptions(false));
			}, 500);
		}
		debounced();
	};

	const handleSubmit = useCallback(
		(e: any) => {
			if (e.keyCode === 13 || e.type === 'submit') {
				e.preventDefault();
				addVideoToList(search);
				setSearch('');
				setVideo(VIDEO_INITIAL_STATE);
			}
		},
		[search, addVideoToList]
	);

	const handleClick = (option: VideoTypes) => {
		setSearch(option.url);
		setVideo(option);
		setShowOptions(false);
	};

	return (
		<form className="Add-Video-Form" onSubmit={handleSubmit}>
			<input
				name="id"
				id="video-id"
				value={search}
				onChange={handleChange}
				onKeyDown={handleSubmit}
				className="form-input"
			/>
			{showOptions && (
				<OptionsList
					options={options}
					handleClick={handleClick}
					isLoading={isLoadingOptions}
				/>
			)}
			{video.img && (
				<div className="Video-Add__Preview">
					<Avatar variant="square" alt={video.img} src={video.img} />
					<ListItemText primary={video.name} secondary={video.description} />
				</div>
			)}

			<IconButton
				type="submit"
				aria-label="add to queue"
				className="form-btn-icon">
				<AddToQueue />
			</IconButton>
		</form>
	);
};

export default memo(AddVideoBar);
