import React, { useState } from 'react';
import './App.css';

// Components
import VideoPlayer from './components/VideoPlayer/VideoPlayer';
import VideoList from './components/VideoList/VideoList';

function App() {
	const [videos, setVideos] = useState<string[] | []>([]);
	const addVideoToList = (data: string) => {
		// log id of YT video being appended to video list
		console.log(data);
		setVideos((vData: string[]) => [...vData, data]);
	};
	return (
		<div className="App">
			<VideoPlayer curVideo={videos[0]} addVideoToList={addVideoToList} />
			<VideoList videos={videos} />
		</div>
	);
}

export default App;
