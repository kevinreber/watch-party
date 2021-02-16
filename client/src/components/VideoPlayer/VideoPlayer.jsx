import React, { useState, useEffect, useCallback } from 'react';

// Components & Helpers
import { VideoPlayerControls } from '../VideoPlayerControls/VideoPlayerControls';
import { getFormattedTime } from '../../helpers';

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

/**
 * Video Player Component - has all functions to control video player
 *
 * VideoPlayer -> VidePlayerControls -> VolumeControls | VideoPlayerTimeline
 * @param curVideo
 * @param addVideoToList
 * @param socket
 */

// ! NOTE: Avoided using typescript b/c opts passed into YouTube component gives too many errors
const VideoPlayer = ({ curVideo, socket }) => {
	const [playerStatus, setPlayerStatus] = useState(-1);
	const [playerTimeline, setPlayerTimeline] = useState(0);
	const [playerTime, setPlayerTime] = useState({
		current: null,
		remaining: null,
	});
	const [volumeLevel, setVolumeLevel] = useState(100);
	const [muted, setIsMuted] = useState(false);

	// Create player
	const loadVideo = (videoId) => {
		if (!player) {
			player = new window.YT.Player('player', {
				videoId,
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
			console.log('player created', videoId);
		} else {
			player.loadVideoById(videoId);
			console.log('loaded', videoId, player);
		}
		console.log(player);
		console.log(window.YT);
	};

	// Load YT IFrame Player script into html
	useEffect(() => {
		if (curVideo) {
			// TODO: Find better way to emit event
			// Sometimes video will load, but not start on other users browsers
			loadVideo(curVideo);
		}
	}, [curVideo, player]);

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
		socket.emit('event', { state: 'load-video', videoId: curVideo });
		console.log(e.target.getVideoData());
	};

	const handlePlay = useCallback(
		(emit = true) => {
			player.playVideo();
			console.log('play', player.getCurrentTime(), player.getDuration());
			if (emit) {
				const data = {
					currentTime: player.getCurrentTime(),
					state: 'play',
				};
				socket.emit('event', data);
			}
		},
		[socket]
	);

	const handlePause = useCallback(
		(emit = true) => {
			player.pauseVideo();
			console.log('pause', player.getCurrentTime(), player.getDuration());
			if (emit) {
				const data = {
					currentTime: player.getCurrentTime(),
					state: 'pause',
				};
				socket.emit('event', data);
			}
		},
		[socket]
	);

	// MUI passes value through 2nd paramter, DO NOT remove 'e'
	const handleTimelineChange = useCallback(
		(e, value, emit = true) => {
			const duration = player.getDuration();
			const newTime = (value / 100) * duration;
			const remainingTime = duration - newTime;

			player.seekTo(newTime);
			console.log(value, player.getCurrentTime());

			setPlayerTimeline(value);
			if (emit) {
				const data = {
					value,
					newTime,
					state: 'seek',
				};
				socket.emit('event', data);
			}

			// Format current and remaining times into string, ex: "01:00"
			setPlayerTime((st) => ({
				...st,
				current: getFormattedTime(newTime),
				remaining: getFormattedTime(remainingTime, true),
			}));
		},
		[socket]
	);

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

	const handleStateChange = (e) => {
		console.log('state', e.data);
		setPlayerStatus(e.data);
	};

	// * Socket Event Listener
	useEffect(() => {
		if (!socket) return;
		socket.on('receive-event', (data) => {
			console.log(data);
			if (data.state === 'load-video') {
				loadVideo(data.videoId);
			} else if (data.state === 'play') {
				console.log('play function...');
				handlePlay(false);
			} else if (data.state === 'pause') {
				console.log('pause function...');
				handlePause(false);
			} else {
				console.log('seeking...');
				handleTimelineChange(null, data.value, false);
			}
		});
		return () => socket.off('receive-event');
	}, [socket, handlePlay, handlePause, handleTimelineChange]);

	return (
		<div id="primary">
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
