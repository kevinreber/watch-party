import React, { useContext, useCallback } from 'react';
import { UserContext } from '../../store/UserContext';

// components
import ChatBody from '../ChatBody/ChatBody';
import MessageFooter from '../MessageFooter/MessageFooter';
import LoginFooter from '../LoginFooter/LoginFooter';

// MUI
import { List } from '@material-ui/core';

interface ChatListTypes {
	messages: string[];
	sendMessage: Function;
}

const ChatList = ({ messages, sendMessage }: ChatListTypes): JSX.Element => {
	// @ts-ignore
	const { user, setUser } = useContext(UserContext);
	const login = (username: string) => {
		console.log(username);
		setUser(username);
	};

	/** Scroll to Bottom of Chat */
	const setRef = useCallback((node): void => {
		if (node) {
			node.scrollIntoView({ smooth: true });
		}
	}, []);

	return (
		<div className="MessageChat">
			{/* <ul className="MessageChat__Body Page__Body"> */}
			<List>
				<ChatBody messages={messages} setRef={setRef} />
			</List>
			{/* </ul> */}
			<div className="MessageChat__Footer">
				{user ? (
					<MessageFooter sendMessage={sendMessage} />
				) : (
					<LoginFooter login={login} />
				)}
			</div>
		</div>
	);
};

export default ChatList;
