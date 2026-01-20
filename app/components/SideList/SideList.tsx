import { useState, useContext } from "react";
import { Button } from "@mui/material";
import type { RealtimeChannel } from "ably";
import { UserContext } from "~/context/UserContext";
import { useHandleMessagesAbly } from "~/hooks";
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
  channel: RealtimeChannel | null;
  clientId: string | undefined;
  usersCount: number;
}

export const SideList = ({
  videos,
  removeVideoFromList,
  channel,
  clientId,
  usersCount,
}: SideListProps) => {
  const { user } = useContext(UserContext);
  const [activeList, setActiveList] = useState<"videos" | "chats">("videos");
  const { messages, sendMessage, userIsTyping, isTypingMessage, emitTyping, emitStopTyping } =
    useHandleMessagesAbly(channel, user, clientId);

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
            messages={messages}
            sendMessage={sendMessage}
            userIsTyping={userIsTyping}
            isTypingMessage={isTypingMessage}
            user={user}
            onTyping={emitTyping}
            onStopTyping={emitStopTyping}
          />
        )}
      </div>

      <WatchCount usersCount={usersCount} />
    </div>
  );
};
