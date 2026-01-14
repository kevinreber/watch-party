import React from 'react';
import { useParams } from 'react-router-dom';
import { getFormattedTime } from '@helpers';
import { VideoFrame } from './VideoFrame';
import { VideoPlayerControls } from './VideoPlayerControls';

// Variable to control our YT Player
let player;

/**
 * Video Player Component - has all functions to control video player
 */
const VideoPlayer = ({ curVideo, socket, addMessage, username }) => {
  const { roomId } = useParams();

  const [playerStatus, setPlayerStatus] = React.useState(-1);
  const [playerTimeline, setPlayerTimeline] = React.useState(0);
  const [playerTime, setPlayerTime] = React.useState({
    current: null,
    remaining: null,
  });
  const [volumeLevel, setVolumeLevel] = React.useState(100);
  const [muted, setIsMuted] = React.useState(false);
  const [seekToTime, setSeekToTime] = React.useState(0);

  // Create player
  const loadVideo = (videoId) => {
    if (!player) {
      window.YT.ready(() => {
        player = new window.YT.Player('player', {
          videoId,
          height: '100%',
          width: '100%',
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
    } else {
      player.loadVideoById(videoId);
    }
  };

  React.useEffect(() => {
    if (curVideo) {
      loadVideo(curVideo.videoId);
    }
  }, [curVideo, player]);

  const updateTimelineState = () => {
    const currentTime = player.getCurrentTime();
    const duration = player.getDuration();
    const remainingTime = duration - currentTime;
    const time = (currentTime / duration) * 100;

    setPlayerTime((st) => ({
      ...st,
      current: getFormattedTime(currentTime),
      remaining: getFormattedTime(remainingTime, true),
    }));
    setPlayerTimeline(time);
  };

  React.useEffect(() => {
    let interval = null;

    if (playerStatus === 1) {
      interval = setInterval(() => {
        updateTimelineState();
      }, 200);
    } else if (playerStatus !== 1 && playerTimeline !== 0) {
      clearInterval(interval);
    }

    return () => clearInterval(interval);
  }, [playerStatus, playerTimeline]);

  const onPlayerReady = (e) => {
    e.target.pauseVideo();
    socket.emit('event', { state: 'load-video', videoId: curVideo }, roomId);
  };

  const handlePlay = React.useCallback(
    (emit = true) => {
      player.playVideo();
      if (emit) {
        const data = {
          currentTime: player.getCurrentTime(),
          state: 'play',
          username,
          created_at: new Date().getTime(),
        };
        socket.emit('event', data, roomId);
      }
    },
    [socket, roomId],
  );

  const handlePause = React.useCallback(
    (emit = true) => {
      player.pauseVideo();
      if (emit) {
        const data = {
          currentTime: player.getCurrentTime(),
          state: 'pause',
          username,
          created_at: new Date().getTime(),
        };
        socket.emit('event', data, roomId);
      }
    },
    [socket, roomId],
  );

  const handleTimelineChange = React.useCallback(
    (value, emit = true) => {
      const duration = player.getDuration();
      const newTime = (value / 100) * duration;
      const remainingTime = duration - newTime;

      player.seekTo(newTime);
      setSeekToTime(newTime);
      setPlayerTimeline(value);

      if (emit) {
        const data = {
          value,
          newTime,
          state: 'seek',
          username,
          created_at: new Date().getTime(),
        };
        socket.emit('event', data, roomId);
      }

      setPlayerTime((st) => ({
        ...st,
        current: getFormattedTime(newTime),
        remaining: getFormattedTime(remainingTime, true),
      }));
    },
    [socket, roomId],
  );

  const handleVolume = (value) => {
    if (player.isMuted()) {
      player.unMute();
      setIsMuted(false);
    }
    setVolumeLevel(value);
    player.setVolume(value);
  };

  const handleMute = () => {
    if (player.isMuted()) {
      player.unMute();
      setIsMuted(false);
    } else {
      setIsMuted(true);
      player.mute();
    }
  };

  const handleStateChange = (e) => {
    setPlayerStatus(e.data);
  };

  React.useEffect(() => {
    if (!socket) return;
    socket.on('receive-event', (data) => {
      let message;

      if (data.state === 'play') {
        message = `${data.username} resumed video`;
        handlePlay(false);
      } else if (data.state === 'pause') {
        message = `${data.username} paused video`;
        handlePause(false);
      } else if (data.state === 'seek') {
        const duration = player.getDuration();
        const newTime = (data.value / 100) * duration;
        message = `${data.username} jumped to ${getFormattedTime(newTime)}`;
        handleTimelineChange(data.value, false);
      }

      if (message) {
        const messageData = {
          type: 'player-change',
          username: data.username,
          content: message,
          created_at: data.created_at,
        };
        addMessage(messageData);
      }
    });

    return () => socket.off('receive-event');
  }, [socket, handlePlay, handlePause, handleTimelineChange]);

  return (
    <div className="relative bg-black">
      {/* YouTube Player Container */}
      <div id="player" className="w-full aspect-video" />

      <VideoFrame
        curVideo={curVideo}
        socket={socket}
        addMessage={addMessage}
        username={username}
        status={playerStatus}
        seekToTime={seekToTime}
      />

      {/* Video Controls Overlay */}
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
        playerTime={playerTime}
      />
    </div>
  );
};

export default VideoPlayer;
