import React from 'react';

// MUI
import { PlayArrow as PlayArrowIcon, Pause as PauseIcon } from '@mui/icons-material';
import { Grid, IconButton, Box } from '@mui/material';

// Components & Helpers
import { VideoPlayerTimeline } from '../VideoPlayerTimeline';
import { VideoVolumeControls } from '../VideoVolumeControls';

interface PlayerControlProps {
  status: number;
  muted: boolean;
  handlePause: () => void;
  handlePlay: () => void;
  volumeLevel: number;
  handleVolume: (event: Event, value: number | number[]) => void;
  handleMute: () => void;
  playerTimeline: number;
  handleTimelineChange: (event: Event, value: number | number[]) => void;
  playerTime: { current: string; remaining: string };
}

/**
 * VideoPlayerControls
 *
 * VideoPlayer -> VidePlayerControls -> VolumeControls | VideoPlayerTimeline
 */
const VideoPlayerControls = ({
  status,
  muted,
  handlePause,
  handlePlay,
  volumeLevel,
  handleVolume,
  handleMute,
  playerTimeline,
  handleTimelineChange,
  playerTime,
}: PlayerControlProps): JSX.Element => {
  const [volumeSlider, openVolumeSlider] = React.useState(false);
  const toggleVolumeSlider = () => {
    openVolumeSlider((value) => !value);
  };

  const ButtonStatus =
    status === 1 ? (
      <IconButton aria-label="pause" onClick={handlePause}>
        <PauseIcon fontSize="large" />
      </IconButton>
    ) : (
      <IconButton aria-label="play" onClick={handlePlay}>
        <PlayArrowIcon fontSize="large" />
      </IconButton>
    );

  return (
    <>
      <Grid container className="Video-Controls" alignItems="center">
        <Grid className="Player-Controls">
          {ButtonStatus}
        </Grid>
        <Box
          sx={{
            position: 'relative',
            flex: '0 0 auto',
            '&:hover': {
              cursor: 'pointer',
            },
          }}
          onMouseEnter={toggleVolumeSlider}
          onMouseLeave={toggleVolumeSlider}
        >
          <VideoVolumeControls
            muted={muted}
            handleMute={handleMute}
            volumeSlider={volumeSlider}
            volumeControlContainer={{
              position: 'absolute',
              display: { xs: 'none', sm: 'flex' },
              zIndex: 100,
              right: '10px',
              height: '60px',
              padding: '10px 5px',
              '&:hover': {
                cursor: 'pointer',
              },
            }}
            volumeLevel={volumeLevel}
            handleVolume={handleVolume}
          />
        </Box>
        <Grid
          container
          spacing={2}
          sx={{
            width: 'auto',
            flex: '1 1 auto',
            display: 'flex',
            boxSizing: 'border-box',
          }}
        >
          <VideoPlayerTimeline
            playerTime={playerTime}
            playerTimeline={playerTimeline}
            handleTimelineChange={handleTimelineChange}
            sliderContainer={{
              flex: '1 1 auto',
            }}
          />
        </Grid>
      </Grid>
    </>
  );
};

export default VideoPlayerControls;
