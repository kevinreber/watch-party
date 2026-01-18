import { useState, useContext } from "react";
import { Button } from "@mui/material";
import type { Socket } from "socket.io-client";
import { UserContext } from "~/context/UserContext";
import { useHandleMessages } from "~/hooks";
import { WatchList } from "../WatchList/WatchList";
import { ChatList } from "../ChatList/ChatList";
import { WatchCount } from "../WatchCount/WatchCount";

interface Video {
  videoId: string;
  url: string;
  name: string;
  channel?: string;
  description?: string;
  img?: string;
}

interface SideListProps {
  videos: Video[];
  removeVideoFromList: (video: Video) => void;
  socket: Socket | null;
  usersCount: number;
}

export const SideList = ({
  videos,
  removeVideoFromList,
  socket,
  usersCount,
}: SideListProps) => {
  const { user } = useContext(UserContext);
  const [activeList, setActiveList] = useState<"videos" | "chats">("videos");
  const { messages, sendMessage, userIsTyping, isTypingMessage } =
    useHandleMessages(socket, user);

  const toggleActiveList = (active: "videos" | "chats") => {
    setActiveList(active);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ display: "flex", gap: "1rem", padding: "1rem", borderBottom: "1px solid #eee" }}>
        <Button
          onClick={() => toggleActiveList("videos")}
          variant={activeList === "videos" ? "contained" : "outlined"}
        >
          Videos
        </Button>
        <Button
          onClick={() => toggleActiveList("chats")}
          variant={activeList === "chats" ? "contained" : "outlined"}
        >
          Chat
        </Button>
      </div>

      <div style={{ flex: 1, overflow: "auto" }}>
        {activeList === "videos" && (
          <WatchList videos={videos} removeVideo={removeVideoFromList} />
        )}
        {activeList === "chats" && (
          <ChatList
            socket={socket}
            messages={messages}
            sendMessage={sendMessage}
            userIsTyping={userIsTyping}
            isTypingMessage={isTypingMessage}
            user={user}
          />
        )}
      </div>

      <WatchCount usersCount={usersCount} />
    </div>
  );
};
