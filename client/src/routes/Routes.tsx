import React from 'react';

// Dependencies
import { Switch, Route, Redirect, BrowserRouter } from 'react-router-dom';

// Components
import { Room, EnterRoomForm } from '@components';

const Routes = ({ children }: { children?: React.ReactNode }) => {
  return (
    // @ts-ignore
    <BrowserRouter>
      <Switch>
        <Route exact path="/room/:roomId" component={Room} />
        <Route exact path="/" component={EnterRoomForm} />
        <Redirect to="/" />
        {children}
      </Switch>
    </BrowserRouter>
  );
};

export default Routes;
