// Dependencies
import { Switch, Route, Redirect } from 'react-router-dom';

// Components
import Room from '../components/Room/Room';
import EnterRoomForm from '../components/EnterRoomForm/EnterRoomForm';

const Routes = () => {
	return (
		<>
			<Switch>
				<Route exact path="/room/:roomId" component={Room} />
				<Route exact path="/" component={EnterRoomForm} />
				<Redirect to="/" />
			</Switch>
		</>
	);
};

export default Routes;
