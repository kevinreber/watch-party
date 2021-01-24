import React, { useState, useEffect } from 'react';
import YouTube from 'react-youtube';

// MUI
import IconButton from '@material-ui/core/IconButton';
import {
	PlayArrow as PlayArrowIcon,
	Pause as PauseIcon,
	SkipNext,
	SkipPrevious,
	AddToQueue,
} from '@material-ui/icons';

// * react-youtube: https://www.npmjs.com/package/react-youtube
//<YouTube
//	videoId={string} // defaults -> null
//	id={string} // defaults -> null
//	className={string} // defaults -> null
//	containerClassName={string} // defaults -> ''
//	opts={obj} // defaults -> {}
//	onReady={func} // defaults -> noop
//	onPlay={func} // defaults -> noop
//	onPause={func} // defaults -> noop
//	onEnd={func} // defaults -> noop
//	onError={func} // defaults -> noop
//	onStateChange={func} // defaults -> noop
//	onPlaybackRateChange={func} // defaults -> noop
//	onPlaybackQualityChange={func} // defaults -> noop
///>
// * get-youtube-id: https://www.npmjs.com/package/get-youtube-id

/**
 * * Getting Video Information:
 * https://developers.google.com/youtube/iframe_api_reference#Retrieving_video_information
 *
 * methods:
 * player.getCurrentTime() => @returns {float} Current time in video player.
 * player.getDuration() => @returns {float} Total duration of video player.
 * player.getVideoData()  => @returns {author: string; title: string; video_id: string; video_quality: string} Object containing video data.
 */

/**
 * Player Status:
 * -1 = unstarted
 * 0 = ended
 * 1 = playing
 * 2 = paused
 * 3 = buffering
 * 5 = cued
 */

// * Variable to control our YT Player
let player;
// ! NOTE: Avoided using typescript b/c opts passed into YouTube component gives too many errors
const VideoPlayer = ({ curVideo, addVideoToList }) => {
	const [url, setUrl] = useState('https://www.youtube.com/watch?v=OHviieMFY0c');

	const handleChange = (e) => {
		setUrl(e.target.value);
	};

	// Create player
	const loadVideo = () => {
		if (!player) {
			player = new window.YT.Player('player', {
				videoId: curVideo,
				height: '480',
				width: '854',
				playerVars: {
					// https://developers.google.com/youtube/player_parameters
					autoplay: 1,
				},
				events: {
					onReady: onPlayerReady,
					onStateChange: handleStateChange,
					onPlay: handlePlayOnPlayer,
					onPause: handlePauseOnPlayer,
				},
			});
		} else {
			player.loadVideoById(curVideo);
			console.log('loaded', curVideo, player);
		}
	};

	// Load YT IFrame Player script into html
	useEffect(() => {
		if (curVideo !== null) {
			if (!window.YT) {
				const tag = document.createElement('script');
				tag.src = 'https://www.youtube.com/iframe_api';

				window.onYouTubeIframeAPIReady = loadVideo;

				const firstScriptTag = document.getElementsByTagName('script')[0];
				firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
			} else loadVideo();
		} else if (!curVideo && player) {
			player.clearVideo();
		}
	}, [curVideo, player, loadVideo]);

	/** Pauses current video on ready to avoid auto-play and logs video data */
	const onPlayerReady = (e) => {
		// access to player in all event handlers via event.target
		e.target.pauseVideo();
		console.log(e.target.getVideoData());
	};

	const handleSubmit = () => {
		addVideoToList(url);
		setUrl('');
	};

	// Event Handlers for Player ------------------------
	const handlePlayOnPlayer = (e) => {
		console.log(e.target.getCurrentTime());
		// console.log(e.target.getDuration());
		console.log('play', YouTube.PlayerState);
	};
	const handlePauseOnPlayer = (e) => {
		console.log(e.target.getCurrentTime());
		// console.log(e.target.getDuration());
		console.log('pause', player.getCurrentTime());
	};
	// -------------------------------------------------

	const handlePlay = () => {
		player.playVideo();
		console.log('play', player.getCurrentTime());
	};

	const handlePause = () => {
		player.pauseVideo();
		// console.log(e.target.getDuration());
		console.log('pause', player.getCurrentTime());
	};

	const handleStateChange = (e) => {
		console.log(e);
		console.log(player);
	};

	// const player = (
	// 	<YouTube
	// 		videoId={curVideo}
	// 		opts={opts}
	// 		onReady={onPlayerReady}
	// 		onPlay={handlePlay}
	// 		onPause={handlePause}
	// 		onStateChange={handleState}
	// 	/>
	// );
	console.log('player', player);
	return (
		<div>
			<input name="id" id="video-id" value={url} onChange={handleChange} />
			<IconButton aria-label="add to queue" onClick={handleSubmit}>
				<AddToQueue />
			</IconButton>
			<div id="player">
				<h3>No Video Found</h3>
			</div>
			<IconButton aria-label="play" onClick={handlePlay}>
				<PlayArrowIcon />
			</IconButton>
			<IconButton aria-label="pause" onClick={handlePause}>
				<PauseIcon />
			</IconButton>
			<IconButton aria-label="previous">
				<SkipPrevious />
			</IconButton>
			<IconButton aria-label="next">
				<SkipNext />
			</IconButton>
		</div>
	);
};

export default VideoPlayer;
