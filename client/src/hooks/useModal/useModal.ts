import React from 'react';

const useModal = () => {
  const [showModal, setShowModal] = React.useState(false);
  const [modalContent, setModalContent] = React.useState(null);

  const handleModal = (content = null) => {
    setShowModal((show) => !show);
    if (content) {
      setModalContent(content);
    }
  };

  return [showModal, handleModal, modalContent];
};

export default useModal;
