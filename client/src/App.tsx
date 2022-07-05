/* eslint-disable */
import React from 'react';
import { SnackbarProvider } from 'notistack';

import './App.css';

// Components
import { Room, Modal, EnterRoomForm } from '@components';
import { Routes } from './routes';

// Helpers
import { generateName } from '@utils';

// MUI
import { Snackbar } from '@material-ui/core';
import Alert from '@material-ui/lab/Alert';

// Providers
import { UserContext, ModalContext } from '@context';

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

const App = () => {
  const [user, setUser] = React.useState<any>(generateName());
  const userData = React.useMemo(() => ({ user, setUser }), [user, setUser]);
  const [room, setRoom] = React.useState<string>('');

  const [modal, setModal] = React.useState(MODAL_INITIAL_VALUES);
  const modalValues = React.useMemo(() => ({ modal, setModal }), [modal, setModal]);

  // TODO: Make Context Provider for Errors
  const [errors, setErrors] = React.useState<ErrorTypes>({
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
          <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical, horizontal }} autoHideDuration={10000}>
            {/* {room ? (
						<>
						<Room setErrors={setErrors} toggleModal={toggleModal} />
							<Room /> */}
            <Routes />
            {/* </>
					) : (
						<Modal content={<EnterRoomForm />} onDismiss={toggleModal} />
					)} */}
          </SnackbarProvider>
        </UserContext.Provider>
      </ModalContext.Provider>
    </div>
  );
};

export default App;
