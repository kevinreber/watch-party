import axios from 'axios';

/** Check for endpoint else use local server */
const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';

class Api {
	static async request(endpoint, paramsOrData = {}, verb = 'get') {
		console.debug('API Call:', endpoint, paramsOrData, verb);
		let test = `${BASE_URL}/api/${endpoint}`;
		console.log(test);
		try {
			return (
				await axios({
					method: verb,
					url: `${BASE_URL}/api/${endpoint}`,
					[verb === 'get' ? 'options' : 'data']: paramsOrData,
				})
			).data;
			// axios sends query string data via the "params" key,
			// and request body data via the "data" key,
			// so the key we need depends on the HTTP verb
		} catch (err) {
			console.error('API Error:', err);
			throw err;
			// let message = err.response.data.message;
			// throw Array.isArray(message) ? message : [message];
		}
	}

	// static async search
	static async searchForYoutubeVideos(query) {
		return this.request('youtube?q=' + encodeURIComponent(query));
	}
}

export default Api;
