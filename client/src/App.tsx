import { useState, useMemo } from 'react';

import './App.css';

// Components
import Room from './components/Room/Room';
import Modal from './components/Modal/Modal';

// Helpers
import { generateName } from './utils/nameGenerator';

// MUI
import { Snackbar } from '@material-ui/core';
import Alert from '@material-ui/lab/Alert';

// Providers
import { UserContext } from './store/UserContext';

const vertical = 'top';
const horizontal = 'center';
// ! Leave commented out when testing
// const ENDPOINT = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';
const ENDPOINT = 'http://localhost:3001';

interface ErrorTypes {
	open: boolean;
	message: string;
}

function App() {
	const [user, setUser] = useState<any>(generateName());
	const userData = useMemo(() => ({ user, setUser }), [user, setUser]);

	const [showModal, setShowModal] = useState<boolean>(false);

	const [errors, setErrors] = useState<ErrorTypes>({
		open: false,
		message: '',
	});

	const toggleModal = () => setShowModal((show) => !show);

	const closeErrorMessage = () => {
		setErrors((st) => ({ ...st, open: false, message: '' }));
	};

	return (
		<div className="App">
			<UserContext.Provider value={userData}>
				{showModal && (
					<Modal children={'hello world'} onDismiss={toggleModal} />
				)}
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
				<Room
					setErrors={setErrors}
					ENDPOINT={ENDPOINT}
					toggleModal={toggleModal}
				/>
			</UserContext.Provider>
		</div>
	);
}

export default App;
