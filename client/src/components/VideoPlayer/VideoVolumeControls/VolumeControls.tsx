import React from 'react';

// MUI
import { VolumeUp, VolumeOff } from '@material-ui/icons';
import { Slider, Paper, IconButton } from '@material-ui/core';

interface VideoVolumeControlsTypes {
  muted: boolean;
  handleMute: any;
  volumeSlider: boolean;
  volumeControlContainer: any;
  volumeLevel: number;
  handleVolume: any;
}

const VideoVolumeControls = ({
  muted,
  handleMute,
  volumeSlider,
  volumeControlContainer,
  volumeLevel,
  handleVolume,
}: VideoVolumeControlsTypes): JSX.Element => {
  return (
    <>
      <IconButton onClick={() => handleMute()}>
        {muted ? <VolumeOff fontSize="large" /> : <VolumeUp fontSize="large" />}
      </IconButton>
      {volumeSlider && (
        <Paper className={volumeControlContainer}>
          <Slider
            orientation="vertical"
            aria-labelledby="volume-control"
            value={volumeLevel}
            // @ts-ignore
            onChange={handleVolume}
          />
        </Paper>
      )}
    </>
  );
};

export default VideoVolumeControls;
