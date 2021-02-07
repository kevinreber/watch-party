import React from 'react';

interface ChatBodyTypes {
	messages: any[];
	setRef: Function;
}

/** Display receiver and user's chat */
const ChatBody = ({ messages, setRef }: ChatBodyTypes): JSX.Element => {
	const Body = messages.map((message: any, index: number) => {
		const lastMessage = messages.length - 1 === index;
		return (
			// @ts-ignore
			<li key={message} id={message} ref={lastMessage ? setRef : null}>
				<p className="MessageChatBody__message chat__message">
					{message.content}
					<span className="chat__timestamp">12:00pm</span>
				</p>
			</li>
		);
	});
	return <>{Body} </>;
};

export default ChatBody;
