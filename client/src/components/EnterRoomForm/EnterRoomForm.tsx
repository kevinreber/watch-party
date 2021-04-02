import { useState, useContext } from 'react';
import { useHistory } from 'react-router-dom';

// Helpers
import { generateName } from '../../utils/nameGenerator';

// Providers
import { UserContext } from '../../store/UserContext';

const EnterRoomForm = () => {
	const history = useHistory();
	const [roomName, setRoomName] = useState('');
	const { user, setUser } = useContext<any>(UserContext);

	const handleRoomChange = (e: any) => {
		setRoomName(e.target.value);
	};

	const handleUserChange = (e: any) => {
		setUser(e.target.value);
	};

	const handleNewRoom = (random: boolean = false) => {
		let newRoom;
		if (random) {
			newRoom = generateName();
			setRoomName(newRoom);
		} else newRoom = roomName;
		const newRoute = newRoom.toLowerCase().split(' ').join('-');
		const encoded = encodeURIComponent(newRoom);
		console.log(encoded, newRoute);
		history.push(`/room/${newRoute}`);
	};
	return (
		<div>
			Create a Room
			<input
				type="text"
				value={user}
				onChange={handleUserChange}
				placeholder="User Name"
			/>
			<input
				type="text"
				value={roomName}
				onChange={handleRoomChange}
				placeholder="Room Name"
			/>
			<button onClick={() => handleNewRoom()}>Create Room</button>
			<button onClick={() => handleNewRoom(true)}>Get Random Room</button>
		</div>
	);
};

export default EnterRoomForm;
