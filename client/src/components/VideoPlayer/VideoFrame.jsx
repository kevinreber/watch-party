import React from 'react';
import ReactPlayer from 'react-player';
import { useParams } from 'react-router-dom';

export const VideoFrame = ({ curVideo, socket, addMessage, username, status, seekToTime }) => {
  const { roomId } = useParams();

  const playerInstance = React.useRef();
  const [useSeekto, setUseSeekTo] = React.useState(true);

  const videoUrl = curVideo?.url || '';
  const playVideo = status === 1;

  if (playerInstance.current && useSeekto) {
    playerInstance.current.seekTo(60, 'seconds');
    setUseSeekTo(false);
  }

  React.useEffect(() => {
    if (seekToTime !== playerInstance.current?.getCurrentTime()) {
      playerInstance.current?.seekTo(seekToTime, 'seconds');
    }
  }, [seekToTime]);

  return (
    <div className="hidden">
      <ReactPlayer ref={playerInstance} url={videoUrl} playing={playVideo} />
    </div>
  );
};
