import React from 'react';
import moment from 'moment';
import { useParams } from 'react-router-dom';
import { Picker } from 'emoji-mart';
import { List, ListItem, TextField, IconButton, Button } from '@material-ui/core';
import { Send as SendIcon, InsertEmoticon as InsertEmoticonIcon } from '@material-ui/icons';
import { useChatList, useFields } from '@hooks';
// import { LoginFooter } from '@components';
import { UserContext } from '@context';
import { MessageTypes } from '@types';

interface ChatListTypes {
  socket: any;
  messages: MessageTypes[];
  sendMessage: (data: any) => void;
  userIsTyping: boolean;
  isTypingMessage: string;
}

const isValid = (data: string) => {
  return data && data.trim() !== '';
};

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

  const [loginFormData, handleLoginFormChange, resetLoginFormData] = useFields({ username: user });

  const handleLoginSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    // Check if field is empty or white space
    if (!isValid(loginFormData.username)) return;

    login(loginFormData.username);
    resetLoginFormData();
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
          const messageBackgroundColor =
            message.username === user
              ? {
                  color: '#fff',
                  backgroundColor: '#54b78a',
                }
              : {
                  backgroundColor: '#f0f0f0',
                };

          return (
            <ListItem
              alignItems={message.username === user ? 'flex-start' : 'center'}
              key={message.created_at}
              ref={lastMessage ? setRef : null}
            >
              <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                <span style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.5rem' }}>
                  <p style={{ fontWeight: 600, margin: 0 }}>{message.username}</p>
                  <p style={{ fontWeight: 300, margin: 0 }}>{moment(message.created_at).format('h:mm a')}</p>
                  {/* <p>{moment(message.created_at).calendar()}</p> */}
                </span>
                {message.type === 'chat' ? (
                  <p
                    style={{
                      width: '100%',
                      margin: 0,
                      padding: 8,
                      borderRadius: 4,
                      ...messageBackgroundColor,
                    }}
                  >
                    {message.content}
                  </p>
                ) : (
                  <p
                    style={{
                      width: '100%',
                      fontStyle: 'italic',
                      fontWeight: 300,
                      margin: 0,
                      padding: 4,
                      borderRadius: 4,
                    }}
                  >
                    {message.content}
                  </p>
                )}
              </div>
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

        <form onSubmit={handleLoginSubmit}>
          <TextField
            name="username"
            onChange={handleLoginFormChange}
            value={loginFormData.username}
            type="text"
            placeholder="Create Username"
            size="small"
            required
          />
          <Button type="submit" disabled={!loginFormData.username} variant="contained">
            Submit
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ChatList;
