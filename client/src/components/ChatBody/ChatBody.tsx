// Dependencies
import React from 'react';
import moment from 'moment';

// MUI
import { ListItem, ListItemText } from '@material-ui/core';
interface ChatBodyTypes {
	messages: any[];
	setRef: Function;
}

/** Display receiver and user's chat */
const ChatBody = ({ messages, setRef }: ChatBodyTypes): JSX.Element => {
	const Body = messages.map((message: any, index: number) => {
		const lastMessage = messages.length - 1 === index;
		// const date = new Date(message.created_at);
		// const hhmmss = date.toISOString().substring(11, 8);
		return (
			<ListItem
				key={index}
				// @ts-ignore
				ref={lastMessage ? setRef : null}>
				<ListItemText
					primary={message.content}
					secondary={moment(message.created_at).calendar()}
				/>
			</ListItem>
		);
	});
	return <>{Body} </>;
};

export default ChatBody;
