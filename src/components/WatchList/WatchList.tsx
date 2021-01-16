// import React from 'react';

interface Props {
	videos: string[];
	removeVideo: Function;
}

const WatchList = ({ videos, removeVideo }: Props): JSX.Element => {
	return (
		<ul>
			{videos.length > 0 ? (
				videos.map((video: string) => (
					<>
						<li key={video}>{video}</li>
						<button onClick={() => removeVideo(video)}>Remove</button>
					</>
				))
			) : (
				<li>Empty List</li>
			)}
		</ul>
	);
};

export default WatchList;
