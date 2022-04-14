import React, { useState, useEffect, useContext } from 'react';

// Components
import { VideoPlayer, AddVideoBar, SideList, PageContainer } from '@components';

// Helpers & Hooks
import { isValidYTLink, ifArrayContains, loadYTScript } from '@helpers';
import { useParams } from 'react-router-dom';

import { useSetupNewSocket } from '@hooks';

// MUI
// import { Grid, Box } from '@material-ui/core';
import { Box, Grid } from '@mui/material';

// Providers
import { UserContext } from '../../store/UserContext';

// interface RoomTypes {
// 	setErrors: Function;
// 	toggleModal: Function;
// }

const Room = () => {
	// const userData = useMemo(() => ({ user, setUser }), [user, setUser]);

	const [errors, setErrors] = useState({
		open: false,
		message: '',
	});

	// const toggleModal = () => setModal((st) => ({ ...st, isOpen: !st.isOpen }));

	const { user } = useContext<any>(UserContext);
	const { roomId } = useParams<any>();
	const [videos, setVideos] = useState<string[] | []>([]);
	const [messages, setMessages] = useState([]);
	const [usersCount, setUsersCount] = useState(1);

	const { socket } = useSetupNewSocket({ user, roomId });

	// Load YT IFrame Player script into html
	useEffect(() => {
		// @ts-ignore
		if (!window.YT) {
			// @ts-ignore
			loadYTScript();
		}
	}, []);

	const addVideoToList = (video: any) => {
		if (isValidYTLink(video.url)) {
			// @ts-ignore
			if (!ifArrayContains(videos, video)) {
				const updatedVideos = [...videos, video];
				setVideos(updatedVideos);

				const data = {
					type: 'add-video',
					video,
				};
				// emit event
				socket.emit('video-list-event', data);
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
		const data = {
			type: 'remove-video',
			video,
		};

		// emit event
		socket.emit('video-list-event', data);
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
			console.log(data);

			if (data.type === 'add-video') {
				setVideos(data.videos);
			} else if (data.type === 'remove-video') {
				setVideos(data.videos);
			} else setVideos(data.videos);
		});
		// @ts-ignore
		return () => socket.off('update-video-list');
	}, [socket]);

	// * Socket Event Listener
	useEffect(() => {
		if (!socket) return;
		socket.on('update-user-count', (count: number) => {
			setUsersCount(count);
		});
		// @ts-ignore
		return () => socket.off('update-user-count');
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
		<PageContainer>
			<React.Fragment>
				<AddVideoBar addVideoToList={addVideoToList} />
				<Box sx={{ flexGrow: 1 }}>
					<Grid container spacing={2} style={{ width: '100%' }}>
						{/* <Grid container direction="row" justify="space-evenly"> */}
						<Grid style={{ width: '70%' }}>
							<VideoPlayer
								curVideo={videos[0]}
								socket={socket}
								addMessage={appendMessage}
								username={user}
							/>
						</Grid>
						<Grid style={{ width: '30%' }}>
							<SideList
								videos={videos}
								removeVideoFromList={removeVideoFromList}
								messages={messages}
								sendMessage={sendMessage}
								socket={socket}
								usersCount={usersCount}
							/>
						</Grid>
					</Grid>
				</Box>
			</React.Fragment>
		</PageContainer>
	);
};

export default Room;
