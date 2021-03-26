const config = require('../config');
// https://www.npmjs.com/package/youtube-api
const Youtube = require('youtube-api');

if (config.YOUTUBE_API_KEY) {
	Youtube.authenticate({
		type: 'key',
		key: config.YOUTUBE_API_KEY,
	});
}

// Re-formats data for each YouTube video
const mapYoutubeSearchResult = (video) => {
	return {
		videoId: video.id.videoId,
		channel: video.snippet.channelTitle,
		description: video.snippet.description,
		url: 'https://www.youtube.com/watch?v=' + video.id.videoId,
		name: video.snippet.title,
		img: video.snippet.thumbnails.default.url,
	};
};

const searchYoutube = (query) => {
	return new Promise((resolve, reject) => {
		Youtube.search.list(options, (err, data) => {
			if (data && data.data.items) {
				const response = data.data.items.map(mapYoutubeSearchResult);
				resolve(response);
			} else {
				console.warn(data);
				reject();
			}
		});
	});
};

const getYoutubeVideoID = (url) => {
	// const idParts = YOUTUBE_VIDEO_ID_REGEX.exec(url);
	if (!idParts) {
		return;
	}

	const id = idParts[1];
	if (!id) {
		return;
	}

	return id;
};

module.exports = { searchYoutube };
