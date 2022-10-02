import React from 'react';
import moment from 'moment';
import { useParams } from 'react-router-dom';
import { Picker } from 'emoji-mart';
import { List, ListItem, ListItemText, TextField, IconButton } from '@material-ui/core';
import { Send as SendIcon, InsertEmoticon as InsertEmoticonIcon } from '@material-ui/icons';
import { useChatList } from '@hooks';
import { LoginFooter } from '@components';
import { UserContext } from '@context';
import { MessageTypes } from '@types';

interface ChatListTypes {
  socket: any;
  messages: MessageTypes[];
  sendMessage: (data: any) => void;
  userIsTyping: boolean;
  isTypingMessage: string;
}

const ChatList = ({ socket, messages, sendMessage, userIsTyping, isTypingMessage }: ChatListTypes): JSX.Element => {
  // @ts-ignore
  const { roomId } = useParams();
  // @ts-ignore
  const { user, setUser } = React.useContext(UserContext);

  const { formData, handleChange, handleSubmitMessage, toggleShowEmojis, showEmojis, handleEmoji } = useChatList(
    sendMessage,
    socket,
  );

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
        <form onSubmit={handleSubmitMessage}>
          <TextField
            name="content"
            onChange={handleChange}
            value={formData.content}
            type="text"
            placeholder="Type message here..."
            size="small"
            required
          />
          {/* @ts-ignore */}
          <IconButton type="submit" disabled={!formData.content} variant="contained">
            <SendIcon />
          </IconButton>
          <IconButton type="button" onClick={toggleShowEmojis}>
            <InsertEmoticonIcon />
          </IconButton>
          {showEmojis && <Picker onSelect={handleEmoji} native={true} theme="auto" />}
        </form>
        <div style={{ width: '100%', margin: '0', fontSize: '14px', fontStyle: 'italic', fontWeight: '300' }}>
          {userIsTyping && <p>{isTypingMessage}</p>}
        </div>

        <LoginFooter login={login} username={user} />
      </div>
    </div>
  );
};

export default ChatList;
