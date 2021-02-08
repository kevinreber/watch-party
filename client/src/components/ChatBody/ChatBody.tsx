// Dependencies
import React from 'react';

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
		return (
			<ListItem
				key={message.content}
				id={message.content}
				// @ts-ignore
				ref={lastMessage ? setRef : null}>
				<ListItemText>
					{message.content}
					<span className="chat__timestamp">12:00pm</span>
				</ListItemText>
			</ListItem>
		);
	});
	return <>{Body} </>;
};

export default ChatBody;
