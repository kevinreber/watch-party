import React from 'react';

const useGetCurrentUserCount = ({ socket }: { socket: any }) => {
	const [usersCount, setUsersCount] = React.useState(1);

	// * Socket Event Listener
	React.useEffect(() => {
		if (!socket) return;
		socket.on('update-user-count', (count: number) => {
			setUsersCount(count);
		});
		// @ts-ignore
		return () => socket.off('update-user-count');
	}, [socket]);

	return { usersCount };
};

export default useGetCurrentUserCount;
