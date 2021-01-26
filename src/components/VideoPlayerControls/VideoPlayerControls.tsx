import React from 'react';

// MUI
import IconButton from '@material-ui/core/IconButton';
import {
	PlayArrow as PlayArrowIcon,
	Pause as PauseIcon,
	SkipNext,
	SkipPrevious,
} from '@material-ui/icons';

interface PlayerControlProps {
	status: number;
	handlePause: Function;
	handlePlay: Function;
}

export const VideoPlayerControls = ({
	status,
	handlePause,
	handlePlay,
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
			{ButtonStatus}
			<IconButton aria-label="previous">
				<SkipPrevious />
			</IconButton>
			<IconButton aria-label="next">
				<SkipNext />
			</IconButton>
		</div>
	);
};
