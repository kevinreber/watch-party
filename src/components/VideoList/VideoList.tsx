// import React from 'react';

interface Props {
	videos: string[];
}

const VideoList = ({ videos }: Props): JSX.Element => {
	return (
		<ul>
			{videos.length > 0 ? (
				videos.map((video: string) => <li key={video}>{video}</li>)
			) : (
				<li>Empty List</li>
			)}
		</ul>
	);
};

export default VideoList;
