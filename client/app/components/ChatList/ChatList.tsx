import { useState, useRef, useEffect, FormEvent, ChangeEvent } from "react";
import { useParams } from "react-router";
import { Send, MessageCircle } from "lucide-react";
import type { Socket } from "socket.io-client";
import moment from "moment";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { ScrollArea } from "~/components/ui/scroll-area";
import { cn } from "~/lib/utils";

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

const getInitials = (name: string) => {
  return name?.slice(0, 2).toUpperCase() || "??";
};

const getAvatarColor = (name: string) => {
  const colors = [
    "bg-purple-500",
    "bg-blue-500",
    "bg-green-500",
    "bg-yellow-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-red-500",
    "bg-teal-500",
  ];
  const index = name?.charCodeAt(0) % colors.length || 0;
  return colors[index];
};

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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setMessageContent(e.target.value);
    if (socket) {
      socket.emit("MSG:user-is-typing", { roomId });
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (messageContent.trim()) {
      sendMessage({ content: messageContent });
      setMessageContent("");
      if (socket) {
        socket.emit("MSG:no-user-is-typing");
      }
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages List */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
              <MessageCircle className="w-12 h-12 mb-2 opacity-50" />
              <p className="text-sm">No messages yet</p>
              <p className="text-xs">Start the conversation!</p>
            </div>
          ) : (
            messages.map((message, index) => {
              const isOwnMessage = message.username === user;
              const isSystemMessage = message.type !== "chat";

              if (isSystemMessage) {
                return (
                  <div key={`${message.created_at}-${index}`} className="flex justify-center">
                    <span className="text-xs text-muted-foreground italic bg-muted/50 px-3 py-1 rounded-full">
                      {message.content}
                    </span>
                  </div>
                );
              }

              return (
                <div
                  key={`${message.created_at}-${index}`}
                  className={cn("flex gap-2", isOwnMessage ? "flex-row-reverse" : "flex-row")}
                >
                  <div className={cn("h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-xs text-white", getAvatarColor(message.username))}>
                    {getInitials(message.username)}
                  </div>
                  <div className={cn("flex flex-col max-w-[75%]", isOwnMessage ? "items-end" : "items-start")}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-muted-foreground">
                        {isOwnMessage ? "You" : message.username}
                      </span>
                      <span className="text-xs text-muted-foreground/60">
                        {moment(message.created_at).format("h:mm a")}
                      </span>
                    </div>
                    <div
                      className={cn(
                        "px-3 py-2 rounded-2xl text-sm",
                        isOwnMessage
                          ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-br-md"
                          : "bg-muted text-foreground rounded-bl-md"
                      )}
                    >
                      {message.content}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Typing indicator */}
      {userIsTyping && (
        <div className="px-4 py-1">
          <span className="text-xs text-muted-foreground italic animate-pulse">{isTypingMessage}</span>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t border-border/50 bg-background/50">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            name="content"
            onChange={handleChange}
            value={messageContent}
            type="text"
            placeholder="Type a message..."
            className="flex-1 bg-muted/50 border-border/50"
          />
          <Button
            type="submit"
            disabled={!messageContent.trim()}
            size="icon"
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};
