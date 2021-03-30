import { useState, useEffect, useContext } from 'react';
import getYouTubeID from 'get-youtube-id';
import io from 'socket.io-client';

// Components
import VideoPlayer from '../VideoPlayer/VideoPlayer';
import AddVideoBar from '../AddVideoBar/AddVideoBar';
import SideList from '../SideList/SideList';
import Modal from '../Modal/Modal';

// Helpers
import { isValidYTLink, loadYTScript } from '../../helpers';
import { generateName } from '../../utils/nameGenerator';

// MUI
import { Grid } from '@material-ui/core';

// Providers
import { UserContext } from '../../store/UserContext';

interface RoomTypes {
	setErrors: Function;
	ENDPOINT: string;
	toggleModal: Function;
}

const Room = ({ setErrors, ENDPOINT, toggleModal }: RoomTypes): JSX.Element => {
	// const userData = useMemo(() => ({ user, setUser }), [user, setUser]);

	const { user } = useContext<any>(UserContext);
	const [showModal, setShowModal] = useState<boolean>(false);

	const [videos, setVideos] = useState<string[] | []>([]);
	const [messages, setMessages] = useState([]);
	// const [errors, setErrors] = useState<ErrorTypes>({
	// 	open: false,
	// 	message: '',
	// });
	const [socket, setSocket] = useState<any>();

	// const toggleModal = () => setShowModal((show) => !show);

	// Initialize WebSocket connection
	useEffect(() => {
		const setUpNewSocket = () => {
			const newSocket = io(ENDPOINT);
			newSocket.on('connection', (socket: any) => {
				console.log(socket, socket.id);
				console.log('client connected to websocket server');
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
				setErrors((st: any) => ({
					...st,
					open: true,
					message: 'video already in queue',
				}));
		} else
			setErrors((st: any) => ({
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
			username: user,
		};
		// @ts-ignore
		setMessages((m) => [...m, messageData]);
		// @ts-ignore
		socket.emit('send-message', messageData);
	};

	const appendMessage = (message: string) => {
		// @ts-ignore
		setMessages((m) => [...m, message]);
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
				// setMessages((m) => [...m, message]);
				appendMessage(message);
			}
		);
		// @ts-ignore
		// return () => socket.off('user-join');
	}, [socket]);

	return (
		<>
			<AddVideoBar addVideoToList={addVideoToList} />
			<Grid container direction="row" justify="space-evenly">
				<Grid item={true}>
					<VideoPlayer
						curVideo={getYouTubeID(videos[0])}
						socket={socket}
						addMessage={appendMessage}
						username={user}
					/>
				</Grid>
				<SideList
					videos={videos}
					removeVideoFromList={removeVideoFromList}
					messages={messages}
					sendMessage={sendMessage}
					socket={socket}
				/>
			</Grid>
		</>
	);
};

export default Room;
