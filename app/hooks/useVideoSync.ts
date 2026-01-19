import { useState, useEffect, useCallback, useRef } from "react";
import type { Socket } from "socket.io-client";

interface VideoSyncState {
  isPlaying: boolean;
  currentTime: number;
}

interface SyncEvent {
  type: "play" | "pause" | "seek";
  currentTime: number;
  timestamp: number;
}

export const useVideoSync = (socket: Socket | null, roomId: string | undefined) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [seekTime, setSeekTime] = useState<number | null>(null);
  const [isMutedForSync, setIsMutedForSync] = useState(false);
  const isLocalAction = useRef(false);
  const lastSyncTime = useRef(0);
  const hasReceivedInitialSync = useRef(false);

  // Handle play action (local user pressed play)
  const handlePlay = useCallback(() => {
    if (!socket || !roomId) return;

    isLocalAction.current = true;
    setIsPlaying(true);

    socket.emit("VIDEO:sync", {
      roomId,
      type: "play",
      currentTime,
      timestamp: Date.now(),
    });

    setTimeout(() => {
      isLocalAction.current = false;
    }, 100);
  }, [socket, roomId, currentTime]);

  // Handle pause action (local user pressed pause)
  const handlePause = useCallback(() => {
    if (!socket || !roomId) return;

    isLocalAction.current = true;
    setIsPlaying(false);

    socket.emit("VIDEO:sync", {
      roomId,
      type: "pause",
      currentTime,
      timestamp: Date.now(),
    });

    setTimeout(() => {
      isLocalAction.current = false;
    }, 100);
  }, [socket, roomId, currentTime]);

  // Handle seek action (local user seeked)
  const handleSeek = useCallback((time: number) => {
    if (!socket || !roomId) return;

    // Debounce seek events
    const now = Date.now();
    if (now - lastSyncTime.current < 500) return;
    lastSyncTime.current = now;

    isLocalAction.current = true;
    setCurrentTime(time);

    socket.emit("VIDEO:sync", {
      roomId,
      type: "seek",
      currentTime: time,
      timestamp: Date.now(),
    });

    setTimeout(() => {
      isLocalAction.current = false;
    }, 100);
  }, [socket, roomId]);

  // Handle progress update from player (for tracking current time)
  const handleProgress = useCallback((state: { playedSeconds: number }) => {
    if (!isLocalAction.current) {
      setCurrentTime(state.playedSeconds);
    }
  }, []);

  // Handle player ready - request sync state from server
  const handleReady = useCallback(() => {
    if (!socket || !roomId) return;

    socket.emit("VIDEO:request-sync", { roomId });
  }, [socket, roomId]);

  // Handle unmuting after user interaction
  const handleUnmute = useCallback(() => {
    setIsMutedForSync(false);
  }, []);

  // Listen for sync events from other users
  useEffect(() => {
    if (!socket) return;

    const onVideoSync = (event: SyncEvent) => {
      // Ignore if this was triggered by local action
      if (isLocalAction.current) return;

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

    const onSyncState = (state: VideoSyncState) => {
      // If this is the initial sync and video is playing, mute to allow autoplay
      // (browsers block autoplay with sound unless user has interacted)
      if (!hasReceivedInitialSync.current && state.isPlaying) {
        setIsMutedForSync(true);
      }
      hasReceivedInitialSync.current = true;

      setIsPlaying(state.isPlaying);
      if (Math.abs(state.currentTime - currentTime) > 2) {
        setSeekTime(state.currentTime);
      }
      setCurrentTime(state.currentTime);
    };

    socket.on("VIDEO:sync", onVideoSync);
    socket.on("VIDEO:sync-state", onSyncState);

    return () => {
      socket.off("VIDEO:sync", onVideoSync);
      socket.off("VIDEO:sync-state", onSyncState);
    };
  }, [socket, currentTime]);

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
