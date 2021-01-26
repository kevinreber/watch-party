import React from 'react';

// MUI
import IconButton from '@material-ui/core/IconButton';
import {
	PlayArrow as PlayArrowIcon,
	Pause as PauseIcon,
	SkipNext,
	SkipPrevious,
	VolumeUp,
	VolumeOff,
} from '@material-ui/icons';
import Grid from '@material-ui/core/Grid';
import Slider from '@material-ui/core/Slider';

interface PlayerControlProps {
	status: number;
	muted: boolean;
	handlePause: Function;
	handlePlay: Function;
	volumeLevel: number;
	handleVolume: Function;
	handleMute: Function;
}

export const VideoPlayerControls = ({
	status,
	muted,
	handlePause,
	handlePlay,
	volumeLevel,
	handleVolume,
	handleMute,
}: PlayerControlProps) => {
	const ButtonStatus =
		status === 1 ? (
			//  @ts-ignore
			<IconButton aria-label="pause" onClick={handlePause}>
				<PauseIcon />
			</IconButton>
		) : (
			//  @ts-ignore
			<IconButton aria-label="play" onClick={handlePlay}>
				<PlayArrowIcon />
			</IconButton>
		);
	return (
		<div className="Video-Controls">
			<div className="Player-Controls">
				{ButtonStatus}
				<IconButton aria-label="previous">
					<SkipPrevious />
				</IconButton>
				<IconButton aria-label="next">
					<SkipNext />
				</IconButton>
			</div>
			<div className="Volume-Controls">
				<Grid container spacing={2}>
					<Grid item>
						<IconButton onClick={() => handleMute()}>
							{muted ? <VolumeOff /> : <VolumeUp />}
						</IconButton>
					</Grid>
					<Grid item xs>
						<Slider
							value={volumeLevel}
							// @ts-ignore
							onChange={handleVolume}
							aria-labelledby="continuous-slider"
						/>
					</Grid>
				</Grid>
			</div>
		</div>
	);
};
