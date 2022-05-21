import React, { useState, useEffect, useContext } from 'react';

// Components
import { VideoPlayer, AddVideoBar, SideList, PageContainer } from '@components';

// Helpers & Hooks
import { loadYTScript } from '@helpers';
import { useParams } from 'react-router-dom';

import {
	useSetupNewSocket,
	useUpdateVideoList,
	useGetCurrentUserCount,
} from '@hooks';

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

	// const toggleModal = () => setModal((st) => ({ ...st, isOpen: !st.isOpen }));

	const { user } = useContext<any>(UserContext);
	const { roomId } = useParams<any>();
	const [messages, setMessages] = useState([]);

	const { socket } = useSetupNewSocket({ user, roomId });
	const { videos, addVideoToList, removeVideoFromList, errors } =
		useUpdateVideoList({
			socket,
		});

	const { usersCount } = useGetCurrentUserCount({ socket });

	console.log(usersCount);
	// Load YT IFrame Player script into html
	useEffect(() => {
		// @ts-ignore
		if (!window.YT) {
			// @ts-ignore
			loadYTScript();
		}
	}, []);

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
