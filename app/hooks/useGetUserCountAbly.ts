import { useState, useEffect, useCallback } from "react";
import type { RealtimeChannel, PresenceMessage } from "ably";

interface PresenceData {
  username: string;
}

export const useGetUserCountAbly = (channel: RealtimeChannel | null) => {
  const [usersCount, setUsersCount] = useState(1);
  const [users, setUsers] = useState<string[]>([]);

  // Get current presence members
  const updatePresenceCount = useCallback(async () => {
    if (!channel) return;

    try {
      const members = await channel.presence.get();
      setUsersCount(members.length);
      setUsers(
        members.map((m: PresenceMessage) => {
          const data = m.data as PresenceData | undefined;
          return data?.username || m.clientId || "Unknown";
        })
      );
    } catch (err) {
      console.error("Failed to get presence:", err);
    }
  }, [channel]);

  // Subscribe to presence events
  useEffect(() => {
    if (!channel) return;

    const onPresenceEnter = (member: PresenceMessage) => {
      console.log("User entered:", member.clientId);
      updatePresenceCount();
    };

    const onPresenceLeave = (member: PresenceMessage) => {
      console.log("User left:", member.clientId);
      updatePresenceCount();
    };

    const onPresenceUpdate = () => {
      updatePresenceCount();
    };

    // Subscribe to presence events
    channel.presence.subscribe("enter", onPresenceEnter);
    channel.presence.subscribe("leave", onPresenceLeave);
    channel.presence.subscribe("update", onPresenceUpdate);

    // Get initial presence count
    updatePresenceCount();

    return () => {
      channel.presence.unsubscribe("enter", onPresenceEnter);
      channel.presence.unsubscribe("leave", onPresenceLeave);
      channel.presence.unsubscribe("update", onPresenceUpdate);
    };
  }, [channel, updatePresenceCount]);

  return { usersCount, users };
};
