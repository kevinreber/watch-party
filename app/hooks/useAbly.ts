import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router";
import Ably from "ably";
import type { RealtimeChannel } from "ably";

let ablyInstance: Ably.Realtime | null = null;

const getAblyClient = (clientId: string): Ably.Realtime => {
  if (!ablyInstance && typeof window !== "undefined") {
    ablyInstance = new Ably.Realtime({
      authUrl: `/api/ably-auth?clientId=${encodeURIComponent(clientId)}`,
      clientId,
    });
  }
  return ablyInstance!;
};

interface UserPresenceData {
  username: string;
  avatar?: string;
  avatarColor?: string;
}

export const useAbly = (username: string, avatar?: string, avatarColor?: string) => {
  const { roomId } = useParams();
  const [isConnected, setIsConnected] = useState(false);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const clientRef = useRef<Ably.Realtime | null>(null);
  const hasEnteredPresence = useRef(false);
  const presenceDataRef = useRef<UserPresenceData>({ username, avatar, avatarColor });

  // Initialize Ably connection
  useEffect(() => {
    if (typeof window === "undefined" || !username || !roomId) return;

    const clientId = `${username}-${Date.now()}`;
    const client = getAblyClient(clientId);
    clientRef.current = client;

    const onConnected = () => {
      console.log("Connected to Ably");
      setIsConnected(true);
    };

    const onDisconnected = () => {
      console.log("Disconnected from Ably");
      setIsConnected(false);
    };

    const onFailed = (stateChange: Ably.ConnectionStateChange) => {
      console.error("Ably connection failed:", stateChange.reason);
      setIsConnected(false);
    };

    client.connection.on("connected", onConnected);
    client.connection.on("disconnected", onDisconnected);
    client.connection.on("failed", onFailed);

    if (client.connection.state === "connected") {
      setIsConnected(true);
    }

    // Get the room channel
    const roomChannel = client.channels.get(`room:${roomId}`);
    setChannel(roomChannel);

    return () => {
      client.connection.off("connected", onConnected);
      client.connection.off("disconnected", onDisconnected);
      client.connection.off("failed", onFailed);
    };
  }, [username, roomId]);

  // Update presence data ref when props change
  useEffect(() => {
    presenceDataRef.current = { username, avatar, avatarColor };
  }, [username, avatar, avatarColor]);

  // Enter presence when connected
  useEffect(() => {
    if (!channel || !isConnected || !username || hasEnteredPresence.current) return;

    const enterPresence = async () => {
      try {
        await channel.presence.enter(presenceDataRef.current);
        hasEnteredPresence.current = true;
        console.log(`Entered presence in room ${roomId} as ${username}`);
      } catch (err) {
        console.error("Failed to enter presence:", err);
      }
    };

    enterPresence();

    return () => {
      if (hasEnteredPresence.current && channel) {
        channel.presence.leave().catch(console.error);
        hasEnteredPresence.current = false;
      }
    };
  }, [channel, isConnected, username, roomId]);

  // Publish a message to the channel
  const publish = useCallback(
    async (eventName: string, data: unknown) => {
      if (!channel) {
        console.warn("Cannot publish: channel not ready");
        return;
      }
      try {
        await channel.publish(eventName, data);
      } catch (err) {
        console.error(`Failed to publish ${eventName}:`, err);
      }
    },
    [channel]
  );

  // Subscribe to an event on the channel
  const subscribe = useCallback(
    (eventName: string, callback: (message: Ably.Message) => void) => {
      if (!channel) return () => {};

      channel.subscribe(eventName, callback);
      return () => {
        channel.unsubscribe(eventName, callback);
      };
    },
    [channel]
  );

  return {
    channel,
    isConnected,
    publish,
    subscribe,
    clientId: clientRef.current?.auth.clientId,
  };
};
