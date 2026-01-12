import React from 'react';
import { SxProps, Theme } from '@mui/material/styles';
import { Grid, Slider, Typography } from '@mui/material';

interface PlayerTimelineTypes {
  playerTimeline: number;
  handleTimelineChange: (event: Event, value: number | number[]) => void;
  playerTime: { current: string; remaining: string };
  sliderContainer: SxProps<Theme>;
}

/**
 * VideoPlayerTimeline
 *
 * VideoPlayer -> VidePlayerControls -> VolumeControls | VideoPlayerTimeline
 */
const VideoPlayerTimeline = ({
  playerTime,
  playerTimeline,
  handleTimelineChange,
  sliderContainer,
}: PlayerTimelineTypes): JSX.Element => {
  return (
    <>
      <Grid>
        <Typography>{playerTime?.current ? playerTime.current : '00:00'}</Typography>
      </Grid>
      <Grid sx={sliderContainer}>
        <Slider
          value={playerTimeline}
          onChange={handleTimelineChange}
          aria-labelledby="video-slider"
        />
      </Grid>
      <Grid>
        <Typography>{playerTime?.remaining ? playerTime.remaining : '00:00'}</Typography>
      </Grid>
    </>
  );
};

export default VideoPlayerTimeline;
