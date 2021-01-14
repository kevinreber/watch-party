import React, { useState } from 'react';
import YouTube from 'react-youtube';
import getYouTubeID from 'get-youtube-id';

// * react-youtube: https://www.npmjs.com/package/react-youtube
// * get-youtube-id: https://www.npmjs.com/package/get-youtube-id

// ! NOTE: Avoided using typescript b/c opts passed into YouTube component gives too many errors
const VideoPlayer = () => {
	const [url, setUrl] = useState('https://www.youtube.com/watch?v=OHviieMFY0c');
	const [id, setId] = useState('');

	const handleChange = (e) => {
		setUrl(e.target.value);
		setId(getYouTubeID(e.target.value));
	};

	const opts = {
		height: '480',
		width: '854',
		playerVars: {
			// https://developers.google.com/youtube/player_parameters
			autoplay: 1,
		},
	};

	const _onReady = (e) => {
		// access to player in all event handlers via event.target
		e.target.pauseVideo();
	};

	return (
		<div>
			<input name="id" id="video-id" value={url} onChange={handleChange} />
			<YouTube videoId={id} opts={opts} onReady={_onReady} />
		</div>
	);
};

export default VideoPlayer;
