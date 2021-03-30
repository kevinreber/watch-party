import { useState } from 'react';

const useModal = () => {
	const [showModal, setShowModal] = useState(false);
	const [modalContent, setModalContent] = useState(null);

	const handleModal = (content = null) => {
		setShowModal((show) => !show);
		if (content) {
			setModalContent(content);
		}
	};

	return [showModal, handleModal, modalContent];
};

export default useModal;
