import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

// Components & Helpers
import { VideoPlayerControls } from '../VideoPlayerControls/VideoPlayerControls';
import { getFormattedTime } from '../../helpers';

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
const ENDPOINT = 'http://localhost:3001';

// ! NOTE: Avoided using typescript b/c opts passed into YouTube component gives too many errors
const VideoPlayer = ({ curVideo, addVideoToList }) => {
	const [url, setUrl] = useState('https://www.youtube.com/watch?v=OHviieMFY0c');
	const [playerStatus, setPlayerStatus] = useState(-1);
	const [playerTimeline, setPlayerTimeline] = useState(0);
	const [playerTime, setPlayerTime] = useState({
		current: null,
		remaining: null,
	});
	const [volumeLevel, setVolumeLevel] = useState(100);
	const [muted, setIsMuted] = useState(false);
	const [socket, setSocket] = useState();

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
					disablekb: 0,
					// hides controllers
					controls: 0,
				},
				events: {
					onReady: onPlayerReady,
					onStateChange: handleStateChange,
				},
			});
		}
		// ! RESTART PLAYER - TRY LATER
		// else if (player && !curVideo){
		// player.destroy()
		// }
		else {
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

	useEffect(() => {
		if (socket) return;

		const newSocket = io(ENDPOINT);
		newSocket.on('connection', (data) => {
			console.log(data);
			console.log('connected to websocket server');
		});
		console.log(newSocket);
		setSocket(newSocket);
	}, []);

	const updateTimelineState = () => {
		const currentTime = player.getCurrentTime();
		const duration = player.getDuration();
		const remainingTime = duration - currentTime;
		const time = (currentTime / duration) * 100;

		// Format current and remaining times into string, ex: "01:00"
		setPlayerTime((st) => ({
			...st,
			current: getFormattedTime(currentTime),
			remaining: getFormattedTime(remainingTime, true),
		}));
		setPlayerTimeline(time);
	};

	// Timeline Player
	useEffect(() => {
		let interval = null;
		if (playerStatus === 1) {
			interval = setInterval(() => {
				updateTimelineState();
			}, 200);
		} else if (playerStatus !== 1 && playerTimeline !== 0) {
			clearInterval(interval);
		}
		return () => clearInterval(interval);
	}, [playerStatus, playerTimeline]);

	/** Pauses current video on ready to avoid auto-play and logs video data */
	const onPlayerReady = (e) => {
		// access to player in all event handlers via event.target
		e.target.pauseVideo();
		console.log(e.target.getVideoData());
	};

	const handleSubmit = (e) => {
		if (e.keyCode === 13 || e.type === 'submit') {
			e.preventDefault();
			addVideoToList(url);
			setUrl('');
		}
	};

	const handlePlay = () => {
		player.playVideo();
		console.log('play', player.getCurrentTime(), player.getDuration());
		const data = {
			currentTime: player.getCurrentTime(),
			state: player.getPlayerState(),
		};
		socket.emit('send-play', data);
	};

	const handlePause = () => {
		player.pauseVideo();
		console.log('pause', player.getCurrentTime(), player.getDuration());
		const data = {
			currentTime: player.getCurrentTime(),
			state: player.getPlayerState(),
		};
		socket.emit('send-pause', data);
	};

	// MUI passes value through 2nd paramter, DO NOT remove 'e'
	const handleVolume = (e, value) => {
		// Unmute volume if user changes volume and player is already muted
		if (player.isMuted()) {
			player.unMute();
			setIsMuted(false);
		}
		setVolumeLevel(value);
		player.setVolume(value);
		console.log('volume', value);
	};

	const handleMute = () => {
		if (player.isMuted()) {
			player.unMute();
			setIsMuted(false);
		} else {
			setIsMuted(true);
			player.mute();
		}
		console.log('muting', player.isMuted());
	};

	// MUI passes value through 2nd paramter, DO NOT remove 'e'
	const handleTimelineChange = (e, value) => {
		const duration = player.getDuration();
		const newTime = (value / 100) * duration;
		const remainingTime = duration - newTime;

		player.seekTo(newTime);
		console.log(value, player.getCurrentTime());

		setPlayerTimeline(value);

		// Format current and remaining times into string, ex: "01:00"
		setPlayerTime((st) => ({
			...st,
			current: getFormattedTime(newTime),
			remaining: getFormattedTime(remainingTime, true),
		}));
	};

	const handleStateChange = (e) => {
		console.log('state', e.data);
		setPlayerStatus(e.data);
	};

	return (
		<div>
			<form onSubmit={handleSubmit}>
				<input
					name="id"
					id="video-id"
					value={url}
					onChange={handleChange}
					onKeyDown={handleSubmit}
				/>
				<IconButton type="submit" aria-label="add to queue">
					<AddToQueue />
				</IconButton>
			</form>
			<div id="player">
				<h3>No Video Found</h3>
			</div>
			<VideoPlayerControls
				status={playerStatus}
				muted={muted}
				handlePause={handlePause}
				handlePlay={handlePlay}
				volumeLevel={volumeLevel}
				playerTimeline={playerTimeline}
				handleVolume={handleVolume}
				handleMute={handleMute}
				handleTimelineChange={handleTimelineChange}
				playerTime={playerTime}
			/>
		</div>
	);
};

export default VideoPlayer;
