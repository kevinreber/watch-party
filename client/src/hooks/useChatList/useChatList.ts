import React from 'react';

const INITIAL_STATE = {
  content: '',
};

const isValid = (data: string) => {
  return data && data.trim() !== '';
};

const useChatList = (sendMessage: (message: any) => void) => {
  const [formData, setFormData] = React.useState(INITIAL_STATE);
  const [showEmojis, setShowEmojis] = React.useState(false);

  /** Update state in formData */
  const handleChange = (e: any) => {
    const { name, value } = e.target;

    setFormData((fData: any) => ({
      ...fData,
      [name]: value,
    }));
  };

  const handleSubmitMessage = (e: React.FormEvent): void => {
    e.preventDefault();
    // Check if field is empty or white space
    const isFormDataValid = isValid(formData.content);

    if (!isFormDataValid) return;

    sendMessage(formData);
    resetFormData();
  };

  const handleEmoji = (emoji: any) => {
    const event = {
      target: {
        name: 'content',
        value: formData.content + emoji.native,
      },
    };

    handleChange(event);
  };

  const toggleShowEmojis = (): void => setShowEmojis(!showEmojis);
  const resetFormData = () => setFormData(INITIAL_STATE);

  return {
    formData,
    handleChange,
    resetFormData,
    handleSubmitMessage,
    toggleShowEmojis,
    showEmojis,
    handleEmoji,
  };
};

export default useChatList;
