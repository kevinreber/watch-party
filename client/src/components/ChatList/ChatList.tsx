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
	socket: any;
}

const ChatList = ({
	messages,
	sendMessage,
	socket,
}: ChatListTypes): JSX.Element => {
	// @ts-ignore
	const { user, setUser } = useContext(UserContext);
	const login = (username: string) => {
		const type = user ? 'username-updated' : 'user-join';

		socket.emit('user-update', {
			type,
			user,
			username,
		});

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
			<List>
				<ChatBody messages={messages} setRef={setRef} />
			</List>
			<div className="MessageChat__Footer">
				<MessageFooter sendMessage={sendMessage} />
				<LoginFooter login={login} username={user} />
			</div>
		</div>
	);
};

export default ChatList;
