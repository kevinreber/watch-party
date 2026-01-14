/* eslint-disable */
import React from 'react';
import { SnackbarProvider } from 'notistack';
import { TooltipProvider } from './components/ui/tooltip';
import { Routes } from './routes';
import { generateName } from '@utils';
import { UserContext } from '@context';
import './index.css';

const SNACKBAR_POSITION_VERTICAL = 'bottom';
const SNACKBAR_POSITION_HORIZONTAL = 'left';

const App = () => {
  const [user, setUser] = React.useState<any>(generateName());
  const userData = React.useMemo(() => ({ user, setUser }), [user, setUser]);

  // Enable dark mode by default
  React.useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <UserContext.Provider value={userData}>
        <TooltipProvider>
          <SnackbarProvider
            maxSnack={5}
            anchorOrigin={{ vertical: SNACKBAR_POSITION_VERTICAL, horizontal: SNACKBAR_POSITION_HORIZONTAL }}
            autoHideDuration={10000}
          >
            <Routes />
          </SnackbarProvider>
        </TooltipProvider>
      </UserContext.Provider>
    </div>
  );
};

export default App;
