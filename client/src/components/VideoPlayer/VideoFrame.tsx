import React from 'react';
import ReactPlayer from 'react-player';
import { VideoTypes } from '@types';

// Player status constants
const PLAYER_STATUS = {
  UNSTARTED: -1,
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2,
  BUFFERING: 3,
  CUED: 5,
} as const;

interface VideoFrameProps {
  curVideo: VideoTypes | null;
  socket: SocketIOClient.Socket;
  addMessage: (message: Record<string, unknown>) => void;
  username: string;
  status: number;
  seekToTime: number;
}

interface ReactPlayerRef {
  seekTo: (time: number, type?: string) => void;
  getCurrentTime: () => number;
}

export const VideoFrame: React.FC<VideoFrameProps> = ({
  curVideo,
  status,
  seekToTime,
}) => {
  const playerInstance = React.useRef<ReactPlayerRef | null>(null);
  const [useSeekTo, setUseSeekTo] = React.useState<boolean>(true);

  const videoUrl = curVideo?.url || '';
  const playVideo = status === PLAYER_STATUS.PLAYING;

  // Initial seek on mount
  if (playerInstance.current && useSeekTo) {
    playerInstance.current.seekTo(60, 'seconds');
    setUseSeekTo(false);
  }

  // Handle seek time changes
  React.useEffect(() => {
    if (playerInstance.current && seekToTime !== playerInstance.current.getCurrentTime()) {
      playerInstance.current.seekTo(seekToTime, 'seconds');
    }
  }, [seekToTime]);

  return (
    <div id="video-player" style={{ background: 'lightgrey', width: '100%' }}>
      <ReactPlayer
        ref={playerInstance as React.RefObject<ReactPlayerRef>}
        url={videoUrl}
        playing={playVideo}
      />
    </div>
  );
};

export default VideoFrame;
