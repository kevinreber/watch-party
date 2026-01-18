import { useState, useEffect } from "react";
import type { Socket } from "socket.io-client";

export const useGetUserCount = (socket: Socket | null) => {
  const [usersCount, setUsersCount] = useState(1);

  // Socket Event Listener - Update user count
  useEffect(() => {
    if (!socket) return;

    const onUpdateUserCount = (count: number) => {
      setUsersCount(count);
    };

    socket.on("update_user_count", onUpdateUserCount);

    return () => {
      socket.off("update_user_count", onUpdateUserCount);
    };
  }, [socket]);

  return { usersCount };
};
