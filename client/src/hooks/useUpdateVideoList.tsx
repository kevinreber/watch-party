import React from 'react';
import { isValidYTLink, ifArrayContains } from '@helpers';

const useUpdateVideoList = ({ socket }: { socket: any }) => {
	const [videos, setVideos] = React.useState<string[] | []>([]);
	const [errors, setErrors] = React.useState({
		open: false,
		message: '',
	});

	const addVideoToList = (video: any) => {
		if (isValidYTLink(video.url)) {
			// @ts-ignore
			if (!ifArrayContains(videos, video)) {
				const updatedVideos = [...videos, video];
				setVideos(updatedVideos);

				const data = {
					type: 'add-video',
					video,
				};
				// emit event
				socket.emit('video-list-event', data);
			} else
				setErrors((st: any) => ({
					...st,
					open: true,
					message: 'video already in queue',
				}));
		} else
			setErrors((st: any) => ({
				...st,
				open: true,
				message: 'invalid URL',
			}));
	};

	const removeVideoFromList = (video: string) => {
		console.log('removing....');

		const filteredVideos = videos.filter((vid) => vid !== video);
		setVideos(filteredVideos);
		const data = {
			type: 'remove-video',
			video,
		};
		console.log('removed-------');

		// emit event
		socket.emit('video-list-event', data);
	};

	React.useEffect(() => {
		if (!socket) return;
		console.log({ socket });

		socket.on('update-video-list', (data: any) => {
			console.log('updating......', data);

			console.log(data);

			if (data.type === 'add-video') {
				setVideos(data.videos);
			} else if (data.type === 'remove-video') {
				setVideos(data.videos);
			} else setVideos(data.videos);
		});

		return () => socket.off('update-video-list');
	}, [socket]);

	return { videos, addVideoToList, removeVideoFromList, errors };
};

export default useUpdateVideoList;
