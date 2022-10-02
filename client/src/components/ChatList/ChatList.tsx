import React from 'react';
import moment from 'moment';

// components
import { MessageFooter, LoginFooter } from '@components';

// Helpers
import { useParams } from 'react-router-dom';

// MUI
import { List, ListItem, ListItemText } from '@material-ui/core';

import { UserContext } from '@context';

interface ChatListTypes {
  messages: string[];
  sendMessage: () => void;
  socket: any;
}

const ChatList = ({ messages, sendMessage, socket }: ChatListTypes): JSX.Element => {
  // @ts-ignore
  const { user, setUser } = React.useContext(UserContext);
  // @ts-ignore
  const { roomId } = useParams();

  const login = (username: string) => {
    const type = user ? 'username-updated' : 'user-join';

    socket.emit(
      'user-update',
      {
        type,
        user,
        username,
      },
      roomId,
    );

    setUser(username);
  };

  /** Scroll to Bottom of Chat */
  const setRef = React.useCallback((node: any): void => {
    if (node) {
      node.scrollIntoView({ smooth: true });
    }
  }, []);

  return (
    <div className="MessageChat">
      <List>
        {messages.map((message: any, index: number) => {
          const lastMessage = messages.length - 1 === index;

          return (
            <ListItem
              alignItems={message.username === user ? 'flex-start' : 'center'}
              key={message.created_at}
              ref={lastMessage ? setRef : null}
            >
              <ListItemText
                primary={message.content}
                secondary={`${message.username}-${moment(message.created_at).calendar()}`}
              />
            </ListItem>
          );
        })}
      </List>
      <div className="MessageChat__Footer">
        <MessageFooter sendMessage={sendMessage} />
        <LoginFooter login={login} username={user} />
      </div>
    </div>
  );
};

export default ChatList;
