import React, { useContext, useCallback } from 'react';

// components
import { ChatListBody, MessageFooter, LoginFooter } from '@components';

// Helpers
import { useParams } from 'react-router-dom';

// MUI
import { List } from '@material-ui/core';

import { UserContext } from '../../store/UserContext';

interface ChatListTypes {
  messages: string[];
  sendMessage: () => void;
  socket: any;
}

const ChatList = ({ messages, sendMessage, socket }: ChatListTypes): JSX.Element => {
  // @ts-ignore
  const { user, setUser } = useContext(UserContext);
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
  const setRef = useCallback((node): void => {
    if (node) {
      node.scrollIntoView({ smooth: true });
    }
  }, []);

  return (
    <div className="MessageChat">
      <List>
        <ChatListBody messages={messages} setRef={setRef} />
      </List>
      <div className="MessageChat__Footer">
        <MessageFooter sendMessage={sendMessage} />
        <LoginFooter login={login} username={user} />
      </div>
    </div>
  );
};

export default ChatList;
