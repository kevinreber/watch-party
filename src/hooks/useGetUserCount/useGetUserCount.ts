import React from 'react';

export const useGetUserCount = (socket: SocketIOClient.Socket) => {
  const [usersCount, setUsersCount] = React.useState(1);

  // * Socket Event Listener
  // @ts-ignore
  React.useEffect(() => {
    if (!socket) return;
    socket.on('update-user-count', (count: number) => {
      setUsersCount(count);
    });

    return () => socket.off('update-user-count');
  }, [socket]);

  return { usersCount };
};
