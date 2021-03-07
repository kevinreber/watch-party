import './SideList.css';

// Components
import WatchList from '../WatchList/WatchList';
import ChatList from '../ChatList/ChatList';

// MUI
import { Grid, Button } from '@material-ui/core';

interface SideListTypes {
	toggleActiveList: Function;
	activeList: string;
	videos: any;
	removeVideoFromList: Function;
	messages: any;
	sendMessage: Function;
	socket: any;
}

const SideList = ({
	toggleActiveList,
	activeList,
	videos,
	removeVideoFromList,
	messages,
	sendMessage,
	socket,
}: SideListTypes): JSX.Element => {
	return (
		<>
			<Grid item={true} className="Side-List">
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
			</Grid>
		</>
	);
};

export default SideList;
