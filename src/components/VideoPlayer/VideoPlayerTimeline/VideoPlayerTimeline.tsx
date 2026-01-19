import React from 'react';

import { Grid, Slider, Typography } from '@material-ui/core';

interface PlayerTimelineTypes {
  playerTimeline: number;
  handleTimelineChange: any;
  playerTime: { current: string; remaining: string };
  sliderContainer: any;
}

/**
 * VideoPlayerTimeline
 *
 * VideoPlayer -> VidePlayerControls -> VolumeControls | VideoPlayerTimeline
 *
 * @param {number}		playerTime
 * @param {Function}	playerTimeline
 * @param {object} 		handleTimelineChange
 * @param {any} 		sliderContainer
 */

const VideoPlayerTimeline = ({
  playerTime,
  playerTimeline,
  handleTimelineChange,
  sliderContainer,
}: PlayerTimelineTypes): JSX.Element => {
  return (
    <>
      <Grid item={true}>
        <Typography>{playerTime?.current ? playerTime.current : '00:00'}</Typography>
      </Grid>
      <Grid item={true} className={sliderContainer}>
        <Slider
          value={playerTimeline}
          // @ts-ignore
          onChange={handleTimelineChange}
          aria-labelledby="video-slider"
        />
      </Grid>
      <Grid item={true}>
        <Typography>{playerTime?.remaining ? playerTime.remaining : '00:00'}</Typography>
      </Grid>
    </>
  );
};

export default VideoPlayerTimeline;
