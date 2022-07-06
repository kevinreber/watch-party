// Dependencies
import React from 'react';
import { useHistory } from 'react-router-dom';
import { Box, TextField, Button } from '@mui/material/';

// Providers
import { UserContext } from '@context';

// Helpers
import { generateName } from '@utils';

const EnterRoomForm = () => {
  const history = useHistory();
  const [roomName, setRoomName] = React.useState('');
  const { user, setUser } = React.useContext<any>(UserContext);

  const handleRoomChange = (e: any) => {
    setRoomName(e.target.value);
  };

  const handleUserChange = (e: any) => {
    setUser(e.target.value);
  };

  const handleNewRoom = (random = false) => {
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
    <Box
      component="form"
      style={{
        width: '45%',
        maxWidth: '600px',
        margin: '5rem auto auto auto',
      }}
    >
      <h3>Create a Room</h3>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <TextField
          label="Enter User Name"
          value={user}
          onChange={handleUserChange}
          placeholder="User Name"
          size="small"
          margin="normal"
        />
        <TextField
          label="Enter Room Name"
          value={roomName}
          onChange={handleRoomChange}
          placeholder="Room Name"
          size="small"
          margin="normal"
        />
      </div>
      <div
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <Button
          style={{ width: '150px', height: '40px' }}
          onClick={() => handleNewRoom()}
          color="primary"
          variant="outlined"
        >
          Create Room
        </Button>
        <Button
          style={{ width: '150px', height: '40px' }}
          onClick={() => handleNewRoom(true)}
          color="primary"
          variant="outlined"
        >
          Get Random Room
        </Button>
      </div>
    </Box>
  );
};

export default EnterRoomForm;
