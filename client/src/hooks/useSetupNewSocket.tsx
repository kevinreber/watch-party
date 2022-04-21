import React from 'react';
import io from 'socket.io-client';

const ENDPOINT = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';

const useSetupNewSocket = ({
	user,
	roomId,
}: {
	user: string;
	roomId: string;
}) => {
	const [socket, setSocket] = React.useState<any>();

	// Initialize WebSocket connection
	React.useEffect(() => {
		const setUpNewSocket = () => {
			const newWebSocket = io(ENDPOINT);
			newWebSocket.on('connection', (webSocket: any) => {
				console.log(webSocket, webSocket.id);
				console.log('client connected to websocket server');
			});
			console.log(newWebSocket);
			console.log(user, roomId);
			newWebSocket.emit('join-room', user);
			// @ts-ignore
			setSocket(newWebSocket);
		};
		if (!socket) {
			setUpNewSocket();
		}
	}, [socket, roomId, user]);

	return { socket };
};

export default useSetupNewSocket;
