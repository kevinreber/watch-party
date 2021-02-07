import React, { useState, useCallback } from 'react';

// components
import ChatBody from '../ChatBody/ChatBody';
import MessageFooter from '../MessageFooter/MessageFooter';

const ChatList = (): JSX.Element => {
	const [messages, setMessages] = useState([]);

	/** Scroll to Bottom of Chat */
	const setRef = useCallback((node): void => {
		if (node) {
			node.scrollIntoView({ smooth: true });
		}
	}, []);

	const sendMessage = (data: any) => {
		// @ts-ignore
		setMessages((m) => [...m, data]);
	};

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
