// Dependencies
import React, { useContext } from 'react';
import moment from 'moment';
import { ListItem, ListItemText } from '@material-ui/core';

// Providers
import { UserContext } from '../../store/UserContext';

interface ChatListBodyTypes {
  messages: any[];
  setRef: any;
}

/** Display receiver and user's chat */
const ChatListBody = ({ messages, setRef }: ChatListBodyTypes): JSX.Element => {
  // @ts-ignore
  const { user } = useContext(UserContext);

  const Body = messages.map((message: any, index: number) => {
    const lastMessage = messages.length - 1 === index;
    // const date = new Date(message.created_at);
    // const hhmmss = date.toISOString().substring(11, 8);

    return (
      <ListItem
        alignItems={message.username === user ? 'flex-start' : 'center'}
        key={message.created_at}
        // @ts-ignore
        ref={lastMessage ? setRef : null}
      >
        <ListItemText
          primary={message.content}
          secondary={`${message.username}-${moment(message.created_at).calendar()}`}
        />
      </ListItem>
    );
  });

  return <>{Body} </>;
};

export default ChatListBody;
