import { useState, useEffect } from 'react';
import type { Socket } from 'socket.io-client';

export const useGetUserCount = (socket: Socket | undefined) => {
  const [usersCount, setUsersCount] = useState(1);

  // Socket Event Listener
  useEffect(() => {
    if (!socket) return;
    socket.on('update-user-count', (count: number) => {
      setUsersCount(count);
    });

    return () => {
      socket.off('update-user-count');
    };
  }, [socket]);

  return { usersCount };
};
