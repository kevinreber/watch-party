import React, { useState, useEffect } from 'react';
import getYouTubeID from 'get-youtube-id';
import io from 'socket.io-client';

import './App.css';

// Components
import VideoPlayer from './components/VideoPlayer/VideoPlayer';
import WatchList from './components/WatchList/WatchList';
import AddVideoBar from './components/AddVideoBar/AddVideoBar';
import { loadYTScript } from './helpers';

// Helpers
import { isValidYTLink } from './helpers';

// MUI
import { Snackbar, Grid } from '@material-ui/core';
import Alert from '@material-ui/lab/Alert';

const vertical = 'top';
const horizontal = 'center';
const ENDPOINT = 'http://localhost:3001';
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
	const [socket, setSocket] = useState();

	// Initialize WebSocket connection
	useEffect(() => {
		const setUpNewSocket = () => {
			const newSocket = io(ENDPOINT);
			newSocket.on('connection', (data: any) => {
				console.log(data);
				console.log('connected to websocket server');
			});
			console.log(newSocket);
			// @ts-ignore
			setSocket(newSocket);
		};
		if (!socket) {
			setUpNewSocket();
		}
	}, [socket]);

	// Load YT IFrame Player script into html
	useEffect(() => {
		if (!window.YT) {
			// @ts-ignore
			loadYTScript();
		}
	}, []);

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
				// TODO: add 'list-event' socket listener
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
			<AddVideoBar addVideoToList={addVideoToList} />
			<Grid container direction="row" justify="space-evenly">
				<Grid item={true}>
					<VideoPlayer curVideo={getYouTubeID(videos[0])} socket={socket} />
				</Grid>
				<Grid item={true}>
					<WatchList videos={videos} removeVideo={removeVideoFromList} />
				</Grid>
			</Grid>
		</div>
	);
}

export default App;
