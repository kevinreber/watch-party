// Dependencies
import { Switch, Route, Redirect } from 'react-router-dom';

// Components
import Room from '../components/Room/Room';

const Routes = () => {
	return (
		<>
			<Switch>
				<Route exact path="/room/:roomId" component={Room} />
				<Redirect to="/" />
			</Switch>
		</>
	);
};

export default Routes;
