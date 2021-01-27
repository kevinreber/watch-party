import React, { useState } from 'react';

// MUI
import {
	PlayArrow as PlayArrowIcon,
	Pause as PauseIcon,
	SkipNext,
	SkipPrevious,
	VolumeUp,
	VolumeOff,
} from '@material-ui/icons';
import {
	Grid,
	Slider,
	Paper,
	IconButton,
	Typography,
	makeStyles,
} from '@material-ui/core';

// @ts-ignore
const useStyles = makeStyles((theme: any) => ({
	volumeIconContainer: {
		position: 'relative',
		flex: '0 0 auto',
		'&:hover': {
			cursor: 'pointer',
		},
	},
	volumeControlContainer: {
		position: 'absolute',
		display: 'none',
		zIndex: '100',
		right: '10px',
		[theme.breakpoints.up('sm')]: {
			display: 'flex',
			height: '60px',
		},
		padding: '10px 5px',
		'&:hover': {
			cursor: 'pointer',
		},
	},
	sliderContainerWrapper: {
		width: 'auto',
		flex: '1 1 auto',
		display: 'flex',
		boxSizing: 'border-box',
	},
	sliderContainer: {
		flex: '1 1 auto',
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
	// @ts-ignore
	const classes = useStyles();

	const [volumeSlider, openVolumeSlider] = useState(false);
	const toggleVolumeSlider = () => {
		openVolumeSlider((value) => !value);
	};
	const ButtonStatus =
		status === 1 ? (
			//  @ts-ignore
			<IconButton aria-label="pause" onClick={handlePause}>
				<PauseIcon fontSize="large" />
			</IconButton>
		) : (
			//  @ts-ignore
			<IconButton aria-label="play" onClick={handlePlay}>
				<PlayArrowIcon fontSize="large" />
			</IconButton>
		);
	return (
		<>
			{/* @ts-ignore */}
			<Grid
				container={true}
				className="Video-Controls"
				// component={Paper}
				alignItems="center">
				<Grid item={true} className="Player-Controls">
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
					spacing={2}
					className={classes.volumeIconContainer}
					onMouseEnter={toggleVolumeSlider}
					onMouseLeave={toggleVolumeSlider}>
					<IconButton onClick={() => handleMute()}>
						{muted ? (
							<VolumeOff fontSize="large" />
						) : (
							<VolumeUp fontSize="large" />
						)}
					</IconButton>
					{volumeSlider && (
						<Paper className={classes.volumeControlContainer}>
							<Slider
								orientation="vertical"
								aria-labelledby="volume-control"
								value={volumeLevel}
								// @ts-ignore
								onChange={handleVolume}
							/>
						</Paper>
					)}
				</Grid>
				<Grid
					item={true}
					container={true}
					spacing={2}
					className={classes.sliderContainerWrapper}>
					<Grid item={true}>
						<Typography>00:00</Typography>
					</Grid>
					<Grid item={true} className={classes.sliderContainer}>
						<Slider
							value={volumeLevel}
							// @ts-ignore
							onChange={handleVolume}
							aria-labelledby="video-slider"
						/>
					</Grid>
					<Grid item={true}>
						<Typography>00:00</Typography>
					</Grid>
				</Grid>
			</Grid>
		</>
	);
};
