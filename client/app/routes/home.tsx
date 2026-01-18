import { useState, useContext } from "react";
import { useNavigate } from "react-router";
import { Users, Shuffle, ArrowRight, Play, Tv2 } from "lucide-react";

import { UserContext } from "~/context/UserContext";
import { generateName } from "~/utils/generateName";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";

export default function Homepage() {
  const navigate = useNavigate();
  const [roomName, setRoomName] = useState("");
  const { user, setUser } = useContext(UserContext);

  const handleRoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRoomName(e.target.value);
  };

  const handleUserChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUser(e.target.value);
  };

  const handleNewRoom = (random = false) => {
    let newRoom: string;

    if (random) {
      newRoom = generateName();
      setRoomName(newRoom);
    } else {
      newRoom = roomName;
    }

    if (!newRoom.trim()) return;

    const newRoute = newRoom.toLowerCase().split(" ").join("-");
    navigate(`/room/${newRoute}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleNewRoom();
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background gradient effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-blue-900/20" />
      <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-blue-500/30 rounded-full blur-3xl" />

      {/* Logo and title */}
      <div className="relative z-10 text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 shadow-lg shadow-purple-500/25">
            <Tv2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold gradient-text">Watch Party</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Watch videos together with friends in real-time
        </p>
      </div>

      {/* Main card */}
      <Card className="relative z-10 w-full max-w-md glass border-white/10 shadow-2xl">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-2xl">Create a Room</CardTitle>
          <CardDescription>
            Enter your details and start watching together
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* User name input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="w-4 h-4" />
              Your Name
            </label>
            <Input
              value={user}
              onChange={handleUserChange}
              placeholder="Enter your name"
              className="bg-background/50 border-white/10 focus:border-purple-500/50"
            />
          </div>

          {/* Room name input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Play className="w-4 h-4" />
              Room Name
            </label>
            <Input
              value={roomName}
              onChange={handleRoomChange}
              onKeyDown={handleKeyDown}
              placeholder="Enter room name"
              className="bg-background/50 border-white/10 focus:border-purple-500/50"
            />
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              onClick={() => handleNewRoom()}
              disabled={!roomName.trim()}
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg shadow-purple-500/25 transition-all duration-300"
            >
              Create Room
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
              onClick={() => handleNewRoom(true)}
              variant="outline"
              className="flex-1 border-white/10 hover:bg-white/5"
            >
              <Shuffle className="w-4 h-4 mr-2" />
              Random Room
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Features section */}
      <div className="relative z-10 mt-12 grid grid-cols-3 gap-8 text-center max-w-lg">
        <div className="space-y-2">
          <div className="w-12 h-12 mx-auto rounded-xl bg-purple-500/10 flex items-center justify-center">
            <Play className="w-6 h-6 text-purple-400" />
          </div>
          <p className="text-sm text-muted-foreground">Synced Playback</p>
        </div>
        <div className="space-y-2">
          <div className="w-12 h-12 mx-auto rounded-xl bg-blue-500/10 flex items-center justify-center">
            <Users className="w-6 h-6 text-blue-400" />
          </div>
          <p className="text-sm text-muted-foreground">Live Chat</p>
        </div>
        <div className="space-y-2">
          <div className="w-12 h-12 mx-auto rounded-xl bg-green-500/10 flex items-center justify-center">
            <Tv2 className="w-6 h-6 text-green-400" />
          </div>
          <p className="text-sm text-muted-foreground">Video Queue</p>
        </div>
      </div>
    </div>
  );
}
