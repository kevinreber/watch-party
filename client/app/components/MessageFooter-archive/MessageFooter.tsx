import React from 'react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import IconButton from '@mui/material/IconButton';
import { TextField } from '@mui/material';
import { Send as SendIcon, InsertEmoticon as InsertEmoticonIcon } from '@mui/icons-material';
import { useFields } from '@hooks';

const INITIAL_STATE = {
  content: '',
};

const isValid = (data: string) => {
  return data && data.trim() !== '';
};

interface MessageTypes {
  sendMessage: (data: { content: string }) => void;
}

/**
 *
 * ! This file is deprecated and not being used in our codebase.
 * ! It is just to be used for reference
 *
 */

const MessageFooter = ({ sendMessage }: MessageTypes): JSX.Element => {
  const [formData, handleChange, resetFormData] = useFields(INITIAL_STATE);
  const [showEmojis, setShowEmojis] = React.useState(false);

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    const isFormDataValid = isValid(formData.content);

    // Check if field is empty or white space
    if (!isFormDataValid) return;

    sendMessage(formData);
    resetFormData();
  };

  const toggleShowEmojis = (): void => setShowEmojis(!showEmojis);

  // reformat emoji event to handleChange()
  const handleEmoji = (emoji: { native: string }) => {
    const event = {
      target: {
        name: 'content',
        value: formData.content + emoji.native,
      },
    };

    handleChange(event);
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        <TextField
          name="content"
          onChange={handleChange}
          value={formData.content}
          type="text"
          placeholder="Type message here..."
          size="small"
          required
        />
        <IconButton type="submit" disabled={!formData.content}>
          <SendIcon />
        </IconButton>
        <IconButton type="button" onClick={toggleShowEmojis}>
          <InsertEmoticonIcon />
        </IconButton>
        {showEmojis && <Picker data={data} onEmojiSelect={handleEmoji} theme="auto" />}
      </form>
    </>
  );
};

export default MessageFooter;
