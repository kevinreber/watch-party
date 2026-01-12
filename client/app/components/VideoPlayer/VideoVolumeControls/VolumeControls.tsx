import React from 'react';
import { SxProps, Theme } from '@mui/material/styles';

// MUI
import { VolumeUp, VolumeOff } from '@mui/icons-material';
import { Slider, Paper, IconButton } from '@mui/material';

interface VideoVolumeControlsTypes {
  muted: boolean;
  handleMute: () => void;
  volumeSlider: boolean;
  volumeControlContainer: SxProps<Theme>;
  volumeLevel: number;
  handleVolume: (event: Event, value: number | number[]) => void;
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
        <Paper sx={volumeControlContainer}>
          <Slider
            orientation="vertical"
            aria-labelledby="volume-control"
            value={volumeLevel}
            onChange={handleVolume}
          />
        </Paper>
      )}
    </>
  );
};

export default VideoVolumeControls;
