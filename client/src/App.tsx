import { useState, useMemo } from 'react';

import './App.css';

// Components
import Room from './components/Room/Room';
import Modal from './components/Modal/Modal';
import Routes from './routes/Routes';

// Helpers
import { generateName } from './utils/nameGenerator';

// MUI
import { Snackbar } from '@material-ui/core';
import Alert from '@material-ui/lab/Alert';

// Providers
import { UserContext } from './store/UserContext';
import { ModalContext } from './store/ModalContext';
import EnterRoomForm from './components/EnterRoomForm/EnterRoomForm';

const vertical = 'top';
const horizontal = 'center';

interface ErrorTypes {
	open: boolean;
	message: string;
}

const MODAL_INITIAL_VALUES = {
	isOpen: false,
	// content: null,
};

function App() {
	const [user, setUser] = useState<any>(generateName());
	const userData = useMemo(() => ({ user, setUser }), [user, setUser]);
	const [room, setRoom] = useState<string>('');

	const [modal, setModal] = useState(MODAL_INITIAL_VALUES);
	const modalValues = useMemo(() => ({ modal, setModal }), [modal, setModal]);

	// TODO: Make Context Provider for Errors
	const [errors, setErrors] = useState<ErrorTypes>({
		open: false,
		message: '',
	});

	const toggleModal = () => setModal((st) => ({ ...st, isOpen: !st.isOpen }));

	const closeErrorMessage = () => {
		setErrors((st) => ({ ...st, open: false, message: '' }));
	};
	return (
		<div className="App">
			<ModalContext.Provider value={modalValues}>
				<UserContext.Provider value={userData}>
					{/* {modal.isOpen && (
						<Modal content={'hello world'} onDismiss={toggleModal} />
					)} */}
					<button onClick={toggleModal}>Show Modal</button>
					<Snackbar
						anchorOrigin={{ vertical, horizontal }}
						open={errors.open}
						onClose={closeErrorMessage}
						autoHideDuration={3000}>
						<Alert onClose={closeErrorMessage} severity="error">
							{errors.message}
						</Alert>
					</Snackbar>
					{/* {room ? (
						<>
						<Room setErrors={setErrors} toggleModal={toggleModal} /> 
							<Room /> */}
					<Routes />
					{/* </>
					) : (
						<Modal content={<EnterRoomForm />} onDismiss={toggleModal} />
					)} */}
				</UserContext.Provider>
			</ModalContext.Provider>
		</div>
	);
}

export default App;
