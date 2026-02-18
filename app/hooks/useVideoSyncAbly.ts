import { useState, useEffect, useCallback, useRef } from "react";
import type { RealtimeChannel, Message } from "ably";
import { useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";

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
  initialData?: InitialSyncData,
  convexRoomId?: Id<"rooms">
) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [seekTime, setSeekTime] = useState<number | null>(null);
  const [isMutedForSync, setIsMutedForSync] = useState(false);
  const isLocalAction = useRef(false);
  const lastSyncTime = useRef(0);
  const hasReceivedInitialSync = useRef(false);
  const hasInitializedFromConvex = useRef(false);

  // Convex mutation for persisting playback state (enables late joiner sync)
  const syncVideoStateMutation = useMutation(api.videoSync.syncVideoState);

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

  // Track whether we've received meaningful sync data (with a playing video)
  const lastSyncedAt = useRef<number>(0);

  // Initialize from Convex data when available (preferred source of truth)
  useEffect(() => {
    if (!initialData) return;

    // Calculate the actual current time accounting for elapsed time since last sync
    let calculatedTime = initialData.currentTime ?? 0;
    if (initialData.isPlaying && initialData.lastSyncAt) {
      const elapsedSeconds = (Date.now() - initialData.lastSyncAt) / 1000;
      calculatedTime += elapsedSeconds;
    }

    // On first initialization, handle muting for autoplay
    if (!hasInitializedFromConvex.current) {
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

      return;
    }

    // After initialization, still respond to significant Convex subscription updates.
    // This handles the case where a late joiner's initial query had stale data and
    // the subscription later delivers the updated playback state.
    if (initialData.lastSyncAt && initialData.lastSyncAt > lastSyncedAt.current) {
      lastSyncedAt.current = initialData.lastSyncAt;
      setIsPlaying(initialData.isPlaying ?? false);
      setCurrentTime(calculatedTime);
      if (Math.abs(calculatedTime - currentTime) > 2) {
        setSeekTime(calculatedTime);
      }
    }
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

    // Persist to Convex for late joiner sync
    if (convexRoomId) {
      syncVideoStateMutation({ roomId: convexRoomId, type: "play", currentTime }).catch((err) =>
        console.error("Failed to sync play to Convex:", err)
      );
    }

    setTimeout(() => {
      isLocalAction.current = false;
    }, 100);
  }, [channel, roomId, currentTime, clientId, updateServerState, convexRoomId, syncVideoStateMutation]);

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

    // Persist to Convex for late joiner sync
    if (convexRoomId) {
      syncVideoStateMutation({ roomId: convexRoomId, type: "pause", currentTime }).catch((err) =>
        console.error("Failed to sync pause to Convex:", err)
      );
    }

    setTimeout(() => {
      isLocalAction.current = false;
    }, 100);
  }, [channel, roomId, currentTime, clientId, updateServerState, convexRoomId, syncVideoStateMutation]);

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

      // Persist to Convex for late joiner sync
      if (convexRoomId) {
        syncVideoStateMutation({ roomId: convexRoomId, type: "seek", currentTime: time }).catch((err) =>
          console.error("Failed to sync seek to Convex:", err)
        );
      }

      setTimeout(() => {
        isLocalAction.current = false;
      }, 100);
    },
    [channel, roomId, clientId, updateServerState, convexRoomId, syncVideoStateMutation]
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

  // Force re-sync playback state from Convex data, falling back to API
  const forceSync = useCallback(async () => {
    // Try Convex data first (source of truth)
    if (initialData && initialData.lastSyncAt) {
      let calculatedTime = initialData.currentTime ?? 0;
      if (initialData.isPlaying && initialData.lastSyncAt) {
        const elapsedSeconds = (Date.now() - initialData.lastSyncAt) / 1000;
        calculatedTime += elapsedSeconds;
      }

      setIsPlaying(initialData.isPlaying ?? false);
      setCurrentTime(calculatedTime);
      setSeekTime(calculatedTime);
      // Don't mute on manual sync - user interaction satisfies autoplay policy

      return;
    }

    // Fall back to API fetch when Convex data is unavailable
    await fetchInitialState();
  }, [initialData, fetchInitialState]);

  // Reset initial sync flag when room changes
  useEffect(() => {
    hasReceivedInitialSync.current = false;
    hasInitializedFromConvex.current = false;
    lastSyncedAt.current = 0;
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
    forceSync,
  };
};
