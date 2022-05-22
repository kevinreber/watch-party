import React from 'react';

// MUI
import { VolumeUp, VolumeOff } from '@material-ui/icons';
import { Slider, Paper, IconButton } from '@material-ui/core';

interface VolumeControlsTypes {
  muted: boolean;
  handleMute: any;
  volumeSlider: boolean;
  volumeControlContainer: any;
  volumeLevel: number;
  handleVolume: any;
}

const VolumeControls = ({
  muted,
  handleMute,
  volumeSlider,
  volumeControlContainer,
  volumeLevel,
  handleVolume,
}: VolumeControlsTypes): JSX.Element => {
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

export default VolumeControls;
