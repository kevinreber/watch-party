import React from 'react';
import { useParams } from 'react-router-dom';
import { getFormattedTime } from '@helpers';
import { VideoFrame } from './VideoFrame';
import { VideoPlayerControls } from './VideoPlayerControls';
import { VideoTypes } from '@types';

// YouTube Player API types
declare global {
  interface Window {
    YT: {
      Player: new (
        elementId: string,
        config: {
          videoId: string;
          height: string;
          width: string;
          playerVars: Record<string, number>;
          events: {
            onReady: (event: YTPlayerEvent) => void;
            onStateChange: (event: YTStateChangeEvent) => void;
          };
        }
      ) => YTPlayer;
      ready: (callback: () => void) => void;
    };
  }
}

interface YTPlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  loadVideoById: (videoId: string) => void;
  seekTo: (seconds: number) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  getVideoData: () => { author: string; title: string; video_id: string; video_quality: string };
  setVolume: (volume: number) => void;
  isMuted: () => boolean;
  mute: () => void;
  unMute: () => void;
}

interface YTPlayerEvent {
  target: YTPlayer;
}

interface YTStateChangeEvent {
  data: number;
  target: YTPlayer;
}

interface PlayerTime {
  current: string | null;
  remaining: string | null;
}

interface VideoPlayerProps {
  curVideo: VideoTypes | null;
  socket: SocketIOClient.Socket;
  addMessage: (message: MessageData) => void;
  username: string;
}

interface MessageData {
  type: string;
  username: string;
  content: string;
  created_at: number;
}

interface PlayerEventData {
  state: string;
  currentTime?: number;
  value?: number;
  videoId?: string;
  username?: string;
  created_at?: number;
}

// Player status constants
const PLAYER_STATUS = {
  UNSTARTED: -1,
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2,
  BUFFERING: 3,
  CUED: 5,
} as const;

// Variable to control our YT Player
let player: YTPlayer | null = null;

/**
 * Video Player Component - has all functions to control video player
 *
 * VideoPlayer -> VidePlayerControls -> VolumeControls | VideoPlayerTimeline
 */
const VideoPlayer: React.FC<VideoPlayerProps> = ({ curVideo, socket, addMessage, username }) => {
  const { roomId } = useParams<{ roomId: string }>();

  const [playerStatus, setPlayerStatus] = React.useState<number>(PLAYER_STATUS.UNSTARTED);
  const [playerTimeline, setPlayerTimeline] = React.useState<number>(0);
  const [playerTime, setPlayerTime] = React.useState<PlayerTime>({
    current: null,
    remaining: null,
  });
  const [volumeLevel, setVolumeLevel] = React.useState<number>(100);
  const [muted, setIsMuted] = React.useState<boolean>(false);
  const [seekToTime, setSeekToTime] = React.useState<number>(0);

  // Create player
  const loadVideo = React.useCallback((videoId: string): void => {
    if (!player) {
      window.YT.ready(() => {
        player = new window.YT.Player('player', {
          videoId,
          height: '480',
          width: '854',
          playerVars: {
            autoplay: 1,
            disablekb: 0,
            controls: 0,
          },
          events: {
            onReady: onPlayerReady,
            onStateChange: handleStateChange,
          },
        });
      });
      console.log('Player created:', videoId);
    } else {
      player.loadVideoById(videoId);
      console.log('Video loaded:', videoId);
    }
  }, []);

  // Load YT IFrame Player script into html
  React.useEffect(() => {
    if (curVideo) {
      loadVideo(curVideo.videoId);
    }
  }, [curVideo, loadVideo]);

  const updateTimelineState = React.useCallback((): void => {
    if (!player) return;

    const currentTime = player.getCurrentTime();
    const duration = player.getDuration();

    if (!duration) return;

    const remainingTime = duration - currentTime;
    const time = (currentTime / duration) * 100;

    setPlayerTime({
      current: getFormattedTime(currentTime),
      remaining: getFormattedTime(remainingTime, true),
    });
    setPlayerTimeline(time);
  }, []);

  // Timeline Player
  React.useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (playerStatus === PLAYER_STATUS.PLAYING) {
      interval = setInterval(() => {
        updateTimelineState();
      }, 200);
    } else if (playerStatus !== PLAYER_STATUS.PLAYING && playerTimeline !== 0) {
      if (interval) clearInterval(interval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [playerStatus, playerTimeline, updateTimelineState]);

  const onPlayerReady = (e: YTPlayerEvent): void => {
    e.target.pauseVideo();
    if (curVideo) {
      socket.emit('event', { state: 'load-video', videoId: curVideo.videoId }, roomId);
    }
    console.log('Player ready:', e.target.getVideoData());
  };

  const handlePlay = React.useCallback(
    (emit = true): void => {
      if (!player) return;

      player.playVideo();
      console.log('Play:', player.getCurrentTime(), player.getDuration());

      if (emit) {
        const data: PlayerEventData = {
          currentTime: player.getCurrentTime(),
          state: 'play',
          username,
          created_at: Date.now(),
        };
        socket.emit('event', data, roomId);
      }
    },
    [socket, roomId, username]
  );

  const handlePause = React.useCallback(
    (emit = true): void => {
      if (!player) return;

      player.pauseVideo();
      console.log('Pause:', player.getCurrentTime(), player.getDuration());

      if (emit) {
        const data: PlayerEventData = {
          currentTime: player.getCurrentTime(),
          state: 'pause',
          username,
          created_at: Date.now(),
        };
        socket.emit('event', data, roomId);
      }
    },
    [socket, roomId, username]
  );

  const handleTimelineChange = React.useCallback(
    (_e: React.ChangeEvent<{}> | null, value: number, emit = true): void => {
      if (!player) return;

      const duration = player.getDuration();
      const newTime = (value / 100) * duration;
      const remainingTime = duration - newTime;

      player.seekTo(newTime);
      setSeekToTime(newTime);
      setPlayerTimeline(value);

      if (emit) {
        const data: PlayerEventData = {
          value,
          newTime,
          state: 'seek',
          username,
          created_at: Date.now(),
        } as PlayerEventData & { newTime: number };
        socket.emit('event', data, roomId);
      }

      setPlayerTime({
        current: getFormattedTime(newTime),
        remaining: getFormattedTime(remainingTime, true),
      });
    },
    [socket, roomId, username]
  );

  const handleVolume = (_e: React.ChangeEvent<{}>, value: number): void => {
    if (!player) return;

    if (player.isMuted()) {
      player.unMute();
      setIsMuted(false);
    }
    setVolumeLevel(value);
    player.setVolume(value);
  };

  const handleMute = (): void => {
    if (!player) return;

    if (player.isMuted()) {
      player.unMute();
      setIsMuted(false);
    } else {
      setIsMuted(true);
      player.mute();
    }
  };

  const handleStateChange = (e: YTStateChangeEvent): void => {
    console.log('Player state:', e.data);
    setPlayerStatus(e.data);
  };

  // Socket Event Listener
  React.useEffect(() => {
    if (!socket) return;

    const handleReceiveEvent = (data: PlayerEventData): void => {
      console.log('Received event:', data);
      let message: string | undefined;

      if (data.state === 'load-video') {
        // Video load handled elsewhere
      } else if (data.state === 'play') {
        message = `${data.username} resumed video`;
        handlePlay(false);
      } else if (data.state === 'pause') {
        message = `${data.username} paused video`;
        handlePause(false);
      } else if (data.state === 'seek' && data.value !== undefined) {
        if (!player) return;
        const duration = player.getDuration();
        const newTime = (data.value / 100) * duration;
        message = `${data.username} jumped to ${getFormattedTime(newTime)}`;
        handleTimelineChange(null, data.value, false);
      }

      if (message && data.username && data.created_at) {
        const messageData: MessageData = {
          type: 'player-change',
          username: data.username,
          content: message,
          created_at: data.created_at,
        };
        addMessage(messageData);
      }
    };

    socket.on('receive-event', handleReceiveEvent);

    return () => {
      socket.off('receive-event', handleReceiveEvent);
    };
  }, [socket, handlePlay, handlePause, handleTimelineChange, addMessage]);

  return (
    <div id="primary">
      <div id="player" style={{ background: 'red', width: '100%' }} />
      <VideoFrame
        curVideo={curVideo}
        socket={socket}
        addMessage={addMessage}
        username={username}
        status={playerStatus}
        seekToTime={seekToTime}
      />
      <VideoPlayerControls
        status={playerStatus}
        muted={muted}
        handlePause={handlePause}
        handlePlay={handlePlay}
        volumeLevel={volumeLevel}
        playerTimeline={playerTimeline}
        handleVolume={handleVolume}
        handleMute={handleMute}
        handleTimelineChange={handleTimelineChange}
        playerTime={playerTime as { current: string; remaining: string }}
      />
    </div>
  );
};

export default VideoPlayer;
