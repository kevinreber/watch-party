import { useState, useEffect, useMemo } from 'react';
import getYouTubeID from 'get-youtube-id';
import io from 'socket.io-client';

import './App.css';

// Components
import VideoPlayer from './components/VideoPlayer/VideoPlayer';
import AddVideoBar from './components/AddVideoBar/AddVideoBar';
import SideList from './components/SideList/SideList';
import Modal from './components/Modal/Modal';

// Helpers
import { isValidYTLink, loadYTScript } from './helpers';
import { generateName } from './utils/nameGenerator';

// MUI
import { Snackbar, Grid } from '@material-ui/core';
import Alert from '@material-ui/lab/Alert';

// Providers
import { UserContext } from './store/UserContext';
import { domainToASCII } from 'url';

const vertical = 'top';
const horizontal = 'center';
const ENDPOINT = 'http://localhost:3001';
interface ErrorTypes {
	open: boolean;
	message: string;
}

function App() {
	const [user, setUser] = useState<any>(generateName());
	const userData = useMemo(() => ({ user, setUser }), [user, setUser]);

	const [showModal, setShowModal] = useState<boolean>(false);

	const [videos, setVideos] = useState<string[] | []>([]);
	const [messages, setMessages] = useState([]);
	const [errors, setErrors] = useState<ErrorTypes>({
		open: false,
		message: '',
	});
	const [socket, setSocket] = useState<any>();

	const toggleModal = () => setShowModal((show) => !show);

	// Initialize WebSocket connection
	useEffect(() => {
		const setUpNewSocket = () => {
			const newSocket = io(ENDPOINT);
			newSocket.on('connection', (socket: any) => {
				console.log(socket, socket.id);
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
		// @ts-ignore
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
			type: 'chat',
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

	// * Socket Event Listener
	// * When new user joins chat
	useEffect(() => {
		if (!socket) return;
		// @ts-ignore
		socket.on(
			'user-updated',
			(data: { type: String; user: String; username: String }) => {
				const content =
					data.type === 'user-join'
						? `${data.username} has joined`
						: `${data.user} changed name to ${data.username}`;
				const message = {
					type: data.type,
					content,
					created_at: new Date().getTime(),
					username: data.username,
				};
				// @ts-ignore
				setMessages((m) => [...m, message]);
			}
		);
		// @ts-ignore
		// return () => socket.off('user-join');
	}, [socket]);

	return (
		<div className="App">
			<UserContext.Provider value={userData}>
				{showModal && (
					<Modal children={'hello world'} onDismiss={toggleModal} />
				)}
				<button onClick={toggleModal}>Show Modal</button>
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
					<SideList
						videos={videos}
						removeVideoFromList={removeVideoFromList}
						messages={messages}
						sendMessage={sendMessage}
						socket={socket}
					/>
				</Grid>
			</UserContext.Provider>
		</div>
	);
}

export default App;
