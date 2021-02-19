require('dotenv').config();

const defaults = {
	DB_URI: '', // MongoDB URI
	YOUTUBE_API_KEY: '', // YouTube API Key
};

module.exports = {
	...defaults,
	...process.env,
};
