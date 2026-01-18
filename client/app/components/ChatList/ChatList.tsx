import { useState, useCallback, FormEvent, ChangeEvent } from "react";
import { useParams } from "react-router";
import { List, ListItem, TextField, IconButton, Button } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import type { Socket } from "socket.io-client";
import moment from "moment";

interface Message {
  type: string;
  content: string;
  created_at: number;
  username: string;
}

interface ChatListProps {
  socket: Socket | null;
  messages: Message[];
  sendMessage: (data: { content: string }) => void;
  userIsTyping: boolean;
  isTypingMessage: string;
  user: string;
}

export const ChatList = ({
  socket,
  messages,
  sendMessage,
  userIsTyping,
  isTypingMessage,
  user,
}: ChatListProps) => {
  const { roomId } = useParams();
  const [messageContent, setMessageContent] = useState("");

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setMessageContent(e.target.value);
    // Emit typing event
    if (socket) {
      socket.emit("MSG:user-is-typing", { roomId });
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (messageContent.trim()) {
      sendMessage({ content: messageContent });
      setMessageContent("");
      // Clear typing indicator
      if (socket) {
        socket.emit("MSG:no-user-is-typing");
      }
    }
  };

  // Scroll to bottom of chat
  const setRef = useCallback((node: HTMLDivElement | null): void => {
    if (node) {
      node.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  return (
    <div className="MessageChat" style={{ display: "flex", flexDirection: "column", height: "400px" }}>
      <List style={{ flex: 1, overflow: "auto" }}>
        {messages.map((message, index) => {
          const lastMessage = messages.length - 1 === index;
          const isOwnMessage = message.username === user;
          const messageBackgroundColor = isOwnMessage
            ? { color: "#fff", backgroundColor: "#54b78a" }
            : { backgroundColor: "#f0f0f0" };

          return (
            <ListItem
              key={`${message.created_at}-${index}`}
              ref={lastMessage ? setRef : null}
              style={{ alignItems: isOwnMessage ? "flex-start" : "center" }}
            >
              <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
                <span style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                  <p style={{ fontWeight: 600, margin: 0 }}>{message.username}</p>
                  <p style={{ fontWeight: 300, margin: 0 }}>
                    {moment(message.created_at).format("h:mm a")}
                  </p>
                </span>
                {message.type === "chat" ? (
                  <p
                    style={{
                      width: "100%",
                      margin: 0,
                      padding: 8,
                      borderRadius: 4,
                      ...messageBackgroundColor,
                    }}
                  >
                    {message.content}
                  </p>
                ) : (
                  <p
                    style={{
                      width: "100%",
                      fontStyle: "italic",
                      fontWeight: 300,
                      margin: 0,
                      padding: 4,
                      borderRadius: 4,
                    }}
                  >
                    {message.content}
                  </p>
                )}
              </div>
            </ListItem>
          );
        })}
      </List>

      <div style={{ padding: "1rem", borderTop: "1px solid #eee" }}>
        <form onSubmit={handleSubmit} style={{ display: "flex", gap: "0.5rem" }}>
          <TextField
            name="content"
            onChange={handleChange}
            value={messageContent}
            type="text"
            placeholder="Type message here..."
            size="small"
            fullWidth
            required
          />
          <IconButton type="submit" disabled={!messageContent.trim()}>
            <SendIcon />
          </IconButton>
        </form>
        {userIsTyping && (
          <p style={{ margin: "0.5rem 0 0", fontSize: "14px", fontStyle: "italic", fontWeight: 300 }}>
            {isTypingMessage}
          </p>
        )}
      </div>
    </div>
  );
};
