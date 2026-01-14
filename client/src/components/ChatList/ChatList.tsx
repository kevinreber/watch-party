import React from 'react';
import moment from 'moment';
import { useParams } from 'react-router-dom';
import { Picker } from 'emoji-mart';
import { useChatList, useFields } from '@hooks';
import { UserContext } from '@context';
import { MessageTypes } from '@types';
import { Send, Smile, User } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { cn } from '../../lib/utils';

interface ChatListTypes {
  socket: any;
  messages: MessageTypes[];
  sendMessage: (data: any) => void;
  userIsTyping: boolean;
  isTypingMessage: string;
}

const isValid = (data: string) => {
  return data && data.trim() !== '';
};

const getInitials = (name: string) => {
  return name?.slice(0, 2).toUpperCase() || '??';
};

const getAvatarColor = (name: string) => {
  const colors = [
    'bg-purple-500',
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-red-500',
    'bg-teal-500',
  ];
  const index = name?.charCodeAt(0) % colors.length || 0;
  return colors[index];
};

const ChatList = ({ socket, messages, sendMessage, userIsTyping, isTypingMessage }: ChatListTypes): JSX.Element => {
  // @ts-ignore
  const { roomId } = useParams();
  // @ts-ignore
  const { user, setUser } = React.useContext(UserContext);

  const { formData, handleChange, handleSubmitMessage, toggleShowEmojis, showEmojis, handleEmoji } = useChatList(
    sendMessage,
    socket,
  );

  const login = (username: string) => {
    const type = user ? 'username-updated' : 'user-join';

    socket.emit(
      'user-update',
      {
        type,
        user,
        username,
      },
      roomId,
    );

    setUser(username);
  };

  const [loginFormData, handleLoginFormChange, resetLoginFormData] = useFields({ username: user });

  const handleLoginSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!isValid(loginFormData.username)) return;

    login(loginFormData.username);
    resetLoginFormData();
  };

  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      {/* Messages List */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
              <MessageBubbleIcon className="w-12 h-12 mb-2 opacity-50" />
              <p className="text-sm">No messages yet</p>
              <p className="text-xs">Start the conversation!</p>
            </div>
          ) : (
            messages.map((message: any, index: number) => {
              const isOwnMessage = message.username === user;
              const isSystemMessage = message.type !== 'chat';

              if (isSystemMessage) {
                return (
                  <div key={message.created_at} className="flex justify-center">
                    <span className="text-xs text-muted-foreground italic bg-muted/50 px-3 py-1 rounded-full">
                      {message.content}
                    </span>
                  </div>
                );
              }

              return (
                <div
                  key={message.created_at}
                  className={cn('flex gap-2', isOwnMessage ? 'flex-row-reverse' : 'flex-row')}
                >
                  <Avatar className={cn('h-8 w-8 shrink-0', getAvatarColor(message.username))}>
                    <AvatarFallback className="text-xs text-white bg-transparent">
                      {getInitials(message.username)}
                    </AvatarFallback>
                  </Avatar>
                  <div className={cn('flex flex-col max-w-[75%]', isOwnMessage ? 'items-end' : 'items-start')}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-muted-foreground">
                        {isOwnMessage ? 'You' : message.username}
                      </span>
                      <span className="text-xs text-muted-foreground/60">
                        {moment(message.created_at).format('h:mm a')}
                      </span>
                    </div>
                    <div
                      className={cn(
                        'px-3 py-2 rounded-2xl text-sm',
                        isOwnMessage
                          ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-br-md'
                          : 'bg-muted text-foreground rounded-bl-md'
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
        {/* Username update */}
        <form onSubmit={handleLoginSubmit} className="flex gap-2 mb-3">
          <div className="relative flex-1">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              name="username"
              onChange={handleLoginFormChange}
              value={loginFormData.username}
              type="text"
              placeholder="Your name"
              className="pl-9 bg-muted/50 border-border/50 text-sm h-9"
            />
          </div>
          <Button
            type="submit"
            disabled={!loginFormData.username}
            variant="outline"
            size="sm"
            className="h-9"
          >
            Update
          </Button>
        </form>

        {/* Message input */}
        <form onSubmit={handleSubmitMessage} className="flex gap-2 relative">
          <Input
            name="content"
            onChange={handleChange}
            value={formData.content}
            type="text"
            placeholder="Type a message..."
            className="flex-1 bg-muted/50 border-border/50 pr-10"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={toggleShowEmojis}
            className="absolute right-14 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <Smile className="w-5 h-5" />
          </Button>
          <Button
            type="submit"
            disabled={!formData.content}
            size="icon"
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>

        {/* Emoji Picker */}
        {showEmojis && (
          <div className="absolute bottom-full right-4 mb-2 z-50">
            <Picker onSelect={handleEmoji} native={true} theme="dark" />
          </div>
        )}
      </div>
    </div>
  );
};

const MessageBubbleIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
  </svg>
);

export default ChatList;
