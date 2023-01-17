/* eslint-disable */
import React from 'react';
import { SnackbarProvider } from 'notistack';

import './App.css';

// Components
import { Routes } from './routes';

// Helpers
import { generateName } from '@utils';

// Providers
import { UserContext } from '@context';

const SNACKBAR_POSITION_VERTICAL = 'bottom';
const SNACKBAR_POSITION_HORIZONTAL = 'left';

interface ErrorTypes {
  open: boolean;
  message: string;
}

const App = () => {
  const [user, setUser] = React.useState<any>(generateName());
  const userData = React.useMemo(() => ({ user, setUser }), [user, setUser]);
  // const [room, setRoom] = React.useState<string>('');

  return (
    <div className="App">
      <UserContext.Provider value={userData}>
        <SnackbarProvider
          maxSnack={5}
          anchorOrigin={{ vertical: SNACKBAR_POSITION_VERTICAL, horizontal: SNACKBAR_POSITION_HORIZONTAL }}
          autoHideDuration={10000}
        >
          <Routes />
        </SnackbarProvider>
      </UserContext.Provider>
    </div>
  );
};

export default App;
