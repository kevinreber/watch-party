import type { Socket } from 'socket.io-client';
import type { VideoTypes, MessageTypes } from '@types';

interface VideoPlayerProps {
  curVideo: VideoTypes | undefined;
  socket: Socket | undefined;
  addMessage: (message: MessageTypes) => void;
  username: string;
}

declare const VideoPlayer: React.FC<VideoPlayerProps>;
export default VideoPlayer;
