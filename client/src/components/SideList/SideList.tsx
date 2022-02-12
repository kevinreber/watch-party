import { useState } from 'react';

// Components
import WatchList from '../WatchList/WatchList';
import ChatList from '../ChatList/ChatList';

// MUI
import { Button } from '@material-ui/core';
import './SideList.css';
import WatchCount from '../WatchCount/WatchCount';

interface SideListTypes {
	videos: any;
	removeVideoFromList: Function;
	messages: any;
	sendMessage: Function;
	socket: any;
	usersCount: number;
}

const SideList = ({
	videos,
	removeVideoFromList,
	messages,
	sendMessage,
	socket,
	usersCount,
}: SideListTypes): JSX.Element => {
	const [activeList, setActiveList] = useState('videos');

	const toggleActiveList = (active: string) => {
		setActiveList(active);
	};

	return (
		<>
			<div className="Side-List-Header">
				<Button onClick={() => toggleActiveList('videos')}>Videos</Button>
				<Button onClick={() => toggleActiveList('chats')}>Chat</Button>
			</div>
			{activeList === 'videos' ? (
				<WatchList videos={videos} removeVideo={removeVideoFromList} />
			) : (
				<ChatList
					messages={messages}
					sendMessage={sendMessage}
					socket={socket}
				/>
			)}
			<WatchCount usersCount={usersCount} />
		</>
	);
};

export default SideList;
