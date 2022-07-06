/* eslint-disable */
import React from 'react';
import { SnackbarProvider } from 'notistack';

import './App.css';

// Components
import { Room, Modal, EnterRoomForm } from '@components';
import { Routes } from './routes';

// Helpers
import { generateName } from '@utils';

// Providers
import { UserContext, ModalContext } from '@context';

const SNACKBAR_POSITION_VERTICAL = 'bottom';
const SNACKBAR_POSITION_HORIZONTAL = 'left';

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

  const toggleModal = () => setModal((st) => ({ ...st, isOpen: !st.isOpen }));

  return (
    <div className="App">
      <ModalContext.Provider value={modalValues}>
        <UserContext.Provider value={userData}>
          {/* {modal.isOpen && (
						<Modal content={'hello world'} onDismiss={toggleModal} />
					)} */}
          <button onClick={toggleModal}>Show Modal</button>
          <SnackbarProvider
            maxSnack={5}
            anchorOrigin={{ vertical: SNACKBAR_POSITION_VERTICAL, horizontal: SNACKBAR_POSITION_HORIZONTAL }}
            autoHideDuration={10000}
          >
            <Routes />
          </SnackbarProvider>
        </UserContext.Provider>
      </ModalContext.Provider>
    </div>
  );
};

export default App;
