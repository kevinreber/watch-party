import React, { useState } from 'react';
import getYouTubeID from 'get-youtube-id';

import './App.css';

// Components
import VideoPlayer from './components/VideoPlayer/VideoPlayer';
import WatchList from './components/WatchList/WatchList';

function App() {
	const [videos, setVideos] = useState<string[] | []>([]);
	const addVideoToList = (data: string) => {
		// log id of YT video being appended to video list

		// @ts-ignore
		if (!videos.includes(data)) {
			setVideos((vData: string[]) => [...vData, data]);
		} else alert('video already exists!');
	};
	const removeVideoFromList = (video: string) => {
		setVideos(videos.filter((vid) => vid !== video));
	};
	return (
		<div className="App">
			<VideoPlayer
				curVideo={getYouTubeID(videos[0])}
				addVideoToList={addVideoToList}
			/>
			<WatchList videos={videos} removeVideo={removeVideoFromList} />
		</div>
	);
}

export default App;
