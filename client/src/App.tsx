import React, { useState } from 'react';
import getYouTubeID from 'get-youtube-id';

import './App.css';

// Components
import VideoPlayer from './components/VideoPlayer/VideoPlayer';
import WatchList from './components/WatchList/WatchList';

// Helpers
import { isValidYTLink } from './helpers';

// MUI
import { Snackbar } from '@material-ui/core';
import Alert from '@material-ui/lab/Alert';

const vertical = 'top';
const horizontal = 'center';
interface ErrorTypes {
	open: boolean;
	message: string;
}

function App() {
	const [videos, setVideos] = useState<string[] | []>([]);
	const [errors, setErrors] = useState<ErrorTypes>({
		open: false,
		message: '',
	});

	const closeErrorMessage = () => {
		setErrors((st) => ({ ...st, open: false, message: '' }));
	};

	// const validateYTLink = (url: string) => getYouTubeID(url);
	const addVideoToList = (data: string) => {
		// log id of YT video being appended to video list

		if (isValidYTLink(data)) {
			// @ts-ignore
			if (!videos.includes(data)) {
				setVideos((vData: string[]) => [...vData, data]);
			} else
				setErrors((st) => ({
					...st,
					open: true,
					message: 'video already in queue',
				}));
		} else
			setErrors((st) => ({
				...st,
				open: true,
				message: 'invalid URL',
			}));
	};
	const removeVideoFromList = (video: string) => {
		setVideos(videos.filter((vid) => vid !== video));
	};

	return (
		<div className="App">
			<Snackbar
				anchorOrigin={{ vertical, horizontal }}
				open={errors.open}
				onClose={closeErrorMessage}
				autoHideDuration={3000}>
				<Alert onClose={closeErrorMessage} severity="error">
					{errors.message}
				</Alert>
			</Snackbar>
			<VideoPlayer
				curVideo={getYouTubeID(videos[0])}
				addVideoToList={addVideoToList}
			/>
			<WatchList videos={videos} removeVideo={removeVideoFromList} />
		</div>
	);
}

export default App;
