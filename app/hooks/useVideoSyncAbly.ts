import { useState, useEffect, useCallback, useRef } from "react";
import type { RealtimeChannel, Message } from "ably";

interface VideoSyncState {
  isPlaying: boolean;
  currentTime: number;
}

interface SyncEvent {
  type: "play" | "pause" | "seek";
  currentTime: number;
  timestamp: number;
  senderId?: string;
}

interface InitialSyncData {
  isPlaying?: boolean;
  currentTime?: number;
  lastSyncAt?: number;
}

export const useVideoSyncAbly = (
  channel: RealtimeChannel | null,
  roomId: string | undefined,
  clientId: string | undefined,
  initialData?: InitialSyncData
) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [seekTime, setSeekTime] = useState<number | null>(null);
  const [isMutedForSync, setIsMutedForSync] = useState(false);
  const isLocalAction = useRef(false);
  const lastSyncTime = useRef(0);
  const hasReceivedInitialSync = useRef(false);
  const hasInitializedFromConvex = useRef(false);

  // Fetch initial video state from API
  const fetchInitialState = useCallback(async () => {
    if (!roomId) return;

    try {
      const response = await fetch(`/api/video-state?roomId=${roomId}`);
      if (response.ok) {
        const state: VideoSyncState & { videos?: unknown[] } = await response.json();

        // If this is the initial sync and video is playing, mute to allow autoplay
        if (!hasReceivedInitialSync.current && state.isPlaying) {
          setIsMutedForSync(true);
        }
        hasReceivedInitialSync.current = true;

        setIsPlaying(state.isPlaying);
        if (Math.abs(state.currentTime - currentTime) > 2) {
          setSeekTime(state.currentTime);
        }
        setCurrentTime(state.currentTime);
      }
    } catch (err) {
      console.error("Failed to fetch initial video state:", err);
    }
  }, [roomId, currentTime]);

  // Update server state
  const updateServerState = useCallback(
    async (type: string, time: number) => {
      if (!roomId) return;

      try {
        await fetch("/api/video-state", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomId, type, currentTime: time }),
        });
      } catch (err) {
        console.error("Failed to update server state:", err);
      }
    },
    [roomId]
  );

  // Initialize from Convex data when available (preferred source of truth)
  useEffect(() => {
    if (hasInitializedFromConvex.current || !initialData) return;

    // Calculate the actual current time accounting for elapsed time since last sync
    let calculatedTime = initialData.currentTime ?? 0;
    if (initialData.isPlaying && initialData.lastSyncAt) {
      const elapsedSeconds = (Date.now() - initialData.lastSyncAt) / 1000;
      calculatedTime += elapsedSeconds;
    }

    // If video is playing, mute to allow autoplay
    if (initialData.isPlaying) {
      setIsMutedForSync(true);
    }

    setIsPlaying(initialData.isPlaying ?? false);
    setCurrentTime(calculatedTime);
    if (calculatedTime > 0) {
      setSeekTime(calculatedTime);
    }

    hasInitializedFromConvex.current = true;
    hasReceivedInitialSync.current = true;
  }, [initialData]);

  // Handle play action (local user pressed play)
  const handlePlay = useCallback(() => {
    if (!channel || !roomId) return;

    isLocalAction.current = true;
    setIsPlaying(true);

    const event: SyncEvent = {
      type: "play",
      currentTime,
      timestamp: Date.now(),
      senderId: clientId,
    };

    channel.publish("video-sync", event);
    updateServerState("play", currentTime);

    setTimeout(() => {
      isLocalAction.current = false;
    }, 100);
  }, [channel, roomId, currentTime, clientId, updateServerState]);

  // Handle pause action (local user pressed pause)
  const handlePause = useCallback(() => {
    if (!channel || !roomId) return;

    isLocalAction.current = true;
    setIsPlaying(false);

    const event: SyncEvent = {
      type: "pause",
      currentTime,
      timestamp: Date.now(),
      senderId: clientId,
    };

    channel.publish("video-sync", event);
    updateServerState("pause", currentTime);

    setTimeout(() => {
      isLocalAction.current = false;
    }, 100);
  }, [channel, roomId, currentTime, clientId, updateServerState]);

  // Handle seek action (local user seeked)
  const handleSeek = useCallback(
    (time: number) => {
      if (!channel || !roomId) return;

      // Debounce seek events
      const now = Date.now();
      if (now - lastSyncTime.current < 500) return;
      lastSyncTime.current = now;

      isLocalAction.current = true;
      setCurrentTime(time);

      const event: SyncEvent = {
        type: "seek",
        currentTime: time,
        timestamp: Date.now(),
        senderId: clientId,
      };

      channel.publish("video-sync", event);
      updateServerState("seek", time);

      setTimeout(() => {
        isLocalAction.current = false;
      }, 100);
    },
    [channel, roomId, clientId, updateServerState]
  );

  // Handle progress update from player (for tracking current time)
  const handleProgress = useCallback((state: { playedSeconds: number }) => {
    if (!isLocalAction.current) {
      setCurrentTime(state.playedSeconds);
    }
  }, []);

  // Handle player ready - fetch initial state only if not already initialized from Convex
  const handleReady = useCallback(() => {
    if (!hasInitializedFromConvex.current) {
      fetchInitialState();
    }
  }, [fetchInitialState]);

  // Handle unmuting after user interaction
  const handleUnmute = useCallback(() => {
    setIsMutedForSync(false);
  }, []);

  // Subscribe to sync events from other users
  useEffect(() => {
    if (!channel) return;

    const onVideoSync = (message: Message) => {
      const event = message.data as SyncEvent;

      // Ignore if this was triggered by local action or our own message
      if (isLocalAction.current || event.senderId === clientId) return;

      switch (event.type) {
        case "play":
          setIsPlaying(true);
          // Sync to the same time position
          if (Math.abs(event.currentTime - currentTime) > 2) {
            setSeekTime(event.currentTime);
          }
          break;
        case "pause":
          setIsPlaying(false);
          break;
        case "seek":
          setSeekTime(event.currentTime);
          setCurrentTime(event.currentTime);
          break;
      }
    };

    channel.subscribe("video-sync", onVideoSync);

    return () => {
      channel.unsubscribe("video-sync", onVideoSync);
    };
  }, [channel, currentTime, clientId]);

  // Clear seek time after it's been used
  useEffect(() => {
    if (seekTime !== null) {
      const timer = setTimeout(() => setSeekTime(null), 100);
      return () => clearTimeout(timer);
    }
  }, [seekTime]);

  // Reset initial sync flag when room changes
  useEffect(() => {
    hasReceivedInitialSync.current = false;
    hasInitializedFromConvex.current = false;
    setIsMutedForSync(false);
  }, [roomId]);

  return {
    isPlaying,
    currentTime: seekTime ?? currentTime,
    isMutedForSync,
    handlePlay,
    handlePause,
    handleSeek,
    handleProgress,
    handleReady,
    handleUnmute,
  };
};
