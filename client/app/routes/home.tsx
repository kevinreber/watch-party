import { useState, useContext } from "react";
import { useNavigate } from "react-router";
import { Box, TextField, Button } from "@mui/material";

import { UserContext } from "@context";
import { generateName } from "@utils";

export function meta() {
  return [
    { title: "Watch Party" },
    { name: "description", content: "Create a room to watch videos together" },
  ];
}

export default function Homepage() {
  const navigate = useNavigate();
  const [roomName, setRoomName] = useState("");
  const { user, setUser } = useContext<any>(UserContext);

  const handleRoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRoomName(e.target.value);
  };

  const handleUserChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUser(e.target.value);
  };

  const handleNewRoom = (random = false) => {
    let newRoom;

    if (random) {
      newRoom = generateName();
      setRoomName(newRoom);
    } else {
      newRoom = roomName;
    }
    const newRoute = newRoom.toLowerCase().split(" ").join("-");

    navigate(`/room/${newRoute}`);
  };

  return (
    <Box
      component="form"
      style={{
        width: "45%",
        maxWidth: "600px",
        margin: "5rem auto auto auto",
      }}
    >
      <h3>Create a Room</h3>
      <div style={{ display: "flex", flexDirection: "column" }}>
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
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <Button
          style={{ width: "150px", height: "40px" }}
          onClick={() => handleNewRoom()}
          color="primary"
          variant="outlined"
        >
          Create Room
        </Button>
        <Button
          style={{ width: "150px", height: "40px" }}
          onClick={() => handleNewRoom(true)}
          color="primary"
          variant="outlined"
        >
          Get Random Room
        </Button>
      </div>
    </Box>
  );
}
