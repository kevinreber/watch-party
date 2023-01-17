import React from 'react';

// Dependencies
import { Switch, Route, Redirect, BrowserRouter } from 'react-router-dom';

// Components
import { Room, Homepage } from '@pages';

const Routes = ({ children }: { children?: React.ReactNode }) => {
  return (
    // @ts-ignore
    <BrowserRouter>
      <Switch>
        <Route exact path="/room/:roomId" component={Room} />
        <Route exact path="/" component={Homepage} />
        <Redirect to="/" />
        {children}
      </Switch>
    </BrowserRouter>
  );
};

export default Routes;
