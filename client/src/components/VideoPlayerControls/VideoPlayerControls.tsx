import React, { useState } from "react";

// Components & Helpers
import { VideoPlayerTimeline, VolumeControls } from "@components";

// MUI
import {
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
} from "@material-ui/icons";
import { Grid, IconButton, makeStyles } from "@material-ui/core";

// @ts-ignore
const useStyles = makeStyles((theme: any) => ({
  volumeIconContainer: {
    position: "relative",
    flex: "0 0 auto",
    "&:hover": {
      cursor: "pointer",
    },
  },
  volumeControlContainer: {
    position: "absolute",
    display: "none",
    zIndex: "100",
    right: "10px",
    [theme.breakpoints.up("sm")]: {
      display: "flex",
      height: "60px",
    },
    padding: "10px 5px",
    "&:hover": {
      cursor: "pointer",
    },
  },
  sliderContainerWrapper: {
    width: "auto",
    flex: "1 1 auto",
    display: "flex",
    boxSizing: "border-box",
  },
  sliderContainer: {
    flex: "1 1 auto",
  },
}));

interface PlayerControlProps {
  status: number;
  muted: boolean;
  handlePause: Function;
  handlePlay: Function;
  volumeLevel: number;
  handleVolume: Function;
  handleMute: Function;
  playerTimeline: number;
  handleTimelineChange: Function;
  playerTime: { current: string; remaining: string };
}

/**
 * VideoPlayerControls
 *
 * VideoPlayer -> VidePlayerControls -> VolumeControls | VideoPlayerTimeline
 *
 * @param {number}		status
 * @param {boolean}		muted
 * @param {Function}	handlePause
 * @param {Function}	handlePlay
 * @param {number}		volumeLevel
 * @param {Function} 	handleVolume
 * @param {Function} 	handleMute
 * @param {number}		playerTimeline
 * @param {Function}	handleTimelineChange
 * @param {object}		playerTime
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
  // @ts-ignore
  const classes = useStyles();

  const [volumeSlider, openVolumeSlider] = useState(false);
  const toggleVolumeSlider = () => {
    openVolumeSlider((value) => !value);
  };
  const ButtonStatus =
    status === 1 ? (
      //  @ts-ignore
      <IconButton aria-label='pause' onClick={handlePause}>
        <PauseIcon fontSize='large' />
      </IconButton>
    ) : (
      //  @ts-ignore
      <IconButton aria-label='play' onClick={handlePlay}>
        <PlayArrowIcon fontSize='large' />
      </IconButton>
    );
  return (
    <>
      {/* @ts-ignore */}
      <Grid
        container={true}
        className='Video-Controls'
        // component={Paper}
        alignItems='center'
      >
        <Grid item={true} className='Player-Controls'>
          {ButtonStatus}
          {/* <IconButton aria-label="previous">
						<SkipPrevious fontSize="large" />
					</IconButton>
					<IconButton aria-label="next">
						<SkipNext fontSize="large" />
					</IconButton> */}
        </Grid>
        <Grid
          item={true}
          className={classes.volumeIconContainer}
          onMouseEnter={toggleVolumeSlider}
          onMouseLeave={toggleVolumeSlider}
        >
          <VolumeControls
            muted={muted}
            handleMute={handleMute}
            volumeSlider={volumeSlider}
            volumeControlContainer={classes.volumeControlContainer}
            volumeLevel={volumeLevel}
            handleVolume={handleVolume}
          />
        </Grid>
        <Grid
          item={true}
          container={true}
          spacing={2}
          className={classes.sliderContainerWrapper}
        >
          <VideoPlayerTimeline
            playerTime={playerTime}
            playerTimeline={playerTimeline}
            handleTimelineChange={handleTimelineChange}
            sliderContainer={classes.sliderContainer}
          />
        </Grid>
      </Grid>
    </>
  );
};

export default VideoPlayerControls;
