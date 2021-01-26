import React, { useState, useEffect } from 'react';

// Components & Helpers
import { VideoPlayerControls } from '../VideoPlayerControls/VideoPlayerControls';

// MUI
import IconButton from '@material-ui/core/IconButton';
import { AddToQueue } from '@material-ui/icons';

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
	const [playerStatus, setPlayerStatus] = useState(-1);
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
				},
			});
		} else {
			player.loadVideoById(curVideo);
			console.log('loaded', curVideo, player);
		}
		console.log(player);
		console.log(window.YT);
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
			} else if (curVideo && !player) loadVideo();
		}
	}, [curVideo, loadVideo, player]);

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

	const handlePlay = () => {
		player.playVideo();
		console.log('play', player.getPlayerState(), player.getCurrentTime());
	};

	const handlePause = () => {
		player.pauseVideo();
		console.log('pause', player.getPlayerState(), player.getCurrentTime());
	};

	const handleStateChange = (e) => {
		console.log('state', e.data);
		setPlayerStatus(e.data);
	};

	return (
		<div>
			<input name="id" id="video-id" value={url} onChange={handleChange} />
			<IconButton aria-label="add to queue" onClick={handleSubmit}>
				<AddToQueue />
			</IconButton>
			<div id="player">
				<h3>No Video Found</h3>
			</div>
			<VideoPlayerControls
				status={playerStatus}
				handlePause={handlePause}
				handlePlay={handlePlay}
			/>
		</div>
	);
};

export default VideoPlayer;
