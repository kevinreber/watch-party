import React from 'react';
import ReactPlayer from 'react-player';
import { useParams } from 'react-router-dom';

/**
 * Player Status:
 * -1 = unstarted
 * 0 = ended
 * 1 = playing
 * 2 = paused
 * 3 = buffering
 * 5 = cued
 */

export const VideoFrame = ({ curVideo, socket, addMessage, username, status, seekToTime }) => {
  const { roomId } = useParams();

  const playerInstance = React.useRef();
  const [useSeekto, setUseSeekTo] = React.useState(true);

  const videoUrl = curVideo?.url || '';
  const playVideo = status === 1;

  const handleSeekTo = () => {};

  if (playerInstance.current && useSeekto) {
    playerInstance.current.seekTo(60, 'seconds');
    setUseSeekTo(false);
  }

  // console.log(playVideo, status);
  // console.log('temp state', seekToTime);

  // const [playerStatus, setPlayerStatus] = React.useState(-1);
  // const [playerTimeline, setPlayerTimeline] = React.useState(0);

  // is 'seekTo' is called
  React.useEffect(() => {
    if (seekToTime !== playerInstance.current.getCurrentTime()) {
      playerInstance.current.seekTo(seekToTime, 'seconds');
    }
  }, [seekToTime]);

  // console.log('CURR VIDEO', curVideo);

  // console.log(playerInstance.current);

  if (videoUrl) {
    handleSeekTo();
  }

  return (
    <div id="video-player" style={{ background: 'lightgrey', width: '100%' }}>
      <ReactPlayer ref={playerInstance} url={videoUrl} playing={playVideo} />
    </div>
  );
};
