import React, { useState, useEffect, useMemo } from 'react';
import getYouTubeID from 'get-youtube-id';
import io from 'socket.io-client';

import './App.css';

// Components
import VideoPlayer from './components/VideoPlayer/VideoPlayer';
import WatchList from './components/WatchList/WatchList';
import AddVideoBar from './components/AddVideoBar/AddVideoBar';
import ChatList from './components/ChatList/ChatList';
import { loadYTScript } from './helpers';

// Helpers
import { isValidYTLink } from './helpers';

// MUI
import { Snackbar, Grid, Button } from '@material-ui/core';
import Alert from '@material-ui/lab/Alert';

// Providers
import { UserContext } from './store/UserContext';

const vertical = 'top';
const horizontal = 'center';
const ENDPOINT = 'http://localhost:3001';
interface ErrorTypes {
	open: boolean;
	message: string;
}

function App() {
	const [user, setUser] = useState<any>(null);
	const userData = useMemo(() => ({ user, setUser }), [user, setUser]);

	const [videos, setVideos] = useState<string[] | []>([]);
	const [messages, setMessages] = useState([]);
	const [errors, setErrors] = useState<ErrorTypes>({
		open: false,
		message: '',
	});
	const [activeList, setActiveList] = useState('videos');
	const [socket, setSocket] = useState<any>();

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

	const addVideoToList = (video: string) => {
		if (isValidYTLink(video)) {
			// @ts-ignore
			if (!videos.includes(video)) {
				const updatedVideos = [...videos, video];
				setVideos(updatedVideos);

				// emit event
				socket.emit('video-list-event', {
					type: 'add-video',
					videos: updatedVideos,
				});
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
		const filteredVideos = videos.filter((vid) => vid !== video);
		setVideos(filteredVideos);

		// emit event
		socket.emit('video-list-event', {
			type: 'remove-video',
			videos: filteredVideos,
		});
	};

	const sendMessage = (data: any) => {
		const { content } = data;
		const messageData = {
			content,
			created_at: new Date().getTime(),
			username: userData.user,
		};
		// @ts-ignore
		setMessages((m) => [...m, messageData]);
		// @ts-ignore
		socket.emit('send-message', messageData);
	};

	// * Socket Event Listener
	useEffect(() => {
		if (!socket) return;
		// @ts-ignore
		socket.on('receive-message', (data) => {
			// @ts-ignore
			setMessages((m) => [...m, data]);
		});
		// @ts-ignore
		return () => socket.off('receive-message');
	}, [socket]);

	// * Socket Event Listener
	useEffect(() => {
		if (!socket) return;
		// @ts-ignore
		socket.on('update-video-list', (data) => {
			if (data.type === 'add-video') {
				setVideos(data.videos);
			} else if (data.type === 'remove-video') {
				setVideos(data.videos);
			}
		});
		// @ts-ignore
		return () => socket.off('update-video-list');
	}, [socket]);

	const toggleActiveList = (active: string) => {
		setActiveList(active);
	};

	return (
		<div className="App">
			<UserContext.Provider value={userData}>
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
						<Button onClick={() => toggleActiveList('videos')}>Videos</Button>
						<Button onClick={() => toggleActiveList('chats')}>Chat</Button>
						{activeList === 'videos' ? (
							<WatchList videos={videos} removeVideo={removeVideoFromList} />
						) : (
							<ChatList messages={messages} sendMessage={sendMessage} />
						)}
					</Grid>
				</Grid>
			</UserContext.Provider>
		</div>
	);
}

export default App;
