import { createContext } from 'react';
// import useModal from '../hooks/useModal';
// import Modal from '../components/Modal/Modal';

// let ModalContext;
// let { Provider } = (ModalContext = createContext({}));

// let ModalProvider = ({ children }: any) => {
// 	let [modal, handleModal, modalContent] = useModal();
// 	return (
// 		<Provider value={{ modal, handleModal, modalContent }}>
// 			<Modal
// 				children={children}
// 				//@ts-ignore
// 				onDismiss={handleModal}
// 			/>
// 		</Provider>
// 	);
// };

export const ModalContext = createContext({});
