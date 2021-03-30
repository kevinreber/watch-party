import { useState } from 'react';

// Helpers
import { generateName } from '../../utils/nameGenerator';

const EnterRoomForm = () => {
	const [roomName, setRoomName] = useState('');

	const handleChange = (e: any) => {
		setRoomName(e.target.value);
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
	};
	return (
		<div>
			Create a Room
			<input type="text" value={roomName} onChange={handleChange} />
			<button onClick={() => handleNewRoom()}>Create Room</button>
			<button onClick={() => handleNewRoom(true)}>Get Random Room</button>
		</div>
	);
};

export default EnterRoomForm;
