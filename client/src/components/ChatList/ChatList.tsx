import React, { useCallback } from 'react';

// components
import ChatBody from '../ChatBody/ChatBody';
import MessageFooter from '../MessageFooter/MessageFooter';

interface ChatListTypes {
	messages: string[];
	sendMessage: Function;
}

const ChatList = ({ messages, sendMessage }: ChatListTypes): JSX.Element => {
	// const [messages, setMessages] = useState([]);

	/** Scroll to Bottom of Chat */
	const setRef = useCallback((node): void => {
		if (node) {
			node.scrollIntoView({ smooth: true });
		}
	}, []);

	return (
		<div className="MessageChat">
			<ul id="MessageChat__Body" className="MessageChat__Body Page__Body">
				<ChatBody messages={messages} setRef={setRef} />
			</ul>
			<div className="MessageChat__Footer">
				<MessageFooter sendMessage={sendMessage} />
			</div>
		</div>
	);
};

export default ChatList;
