import React, { useState } from 'react';
import YouTube from 'react-youtube';

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

// ! NOTE: Avoided using typescript b/c opts passed into YouTube component gives too many errors
const VideoPlayer = ({ curVideo, addVideoToList }) => {
	const [url, setUrl] = useState('https://www.youtube.com/watch?v=OHviieMFY0c');

	const handleChange = (e) => {
		setUrl(e.target.value);
	};

	const opts = {
		height: '480',
		width: '854',
		playerVars: {
			// https://developers.google.com/youtube/player_parameters
			autoplay: 1,
		},
	};

	/** Pauses current video on ready to avoid auto-play and logs video data */
	const _onReady = (e) => {
		// access to player in all event handlers via event.target
		e.target.pauseVideo();
		console.log(e.target.getVideoData());
	};

	const handleSubmit = () => {
		addVideoToList(url);
		setUrl('');
	};

	const handlePlay = (e) => {
		console.log(e.target.getCurrentTime());
		console.log(e.target.getDuration());
	};

	const handlePause = (e) => {
		console.log(e.target.getCurrentTime());
		console.log(e.target.getDuration());
	};

	return (
		<div>
			<input name="id" id="video-id" value={url} onChange={handleChange} />
			<button type="button" onClick={handleSubmit}>
				Add to Queue
			</button>
			<YouTube
				videoId={curVideo}
				opts={opts}
				onReady={_onReady}
				onPlay={handlePlay}
				onPause={handlePause}
			/>
		</div>
	);
};

export default VideoPlayer;
