import React from 'react';
import { ListVideo, MessageCircle, Users } from 'lucide-react';
import { UserContext } from '@context';
import { useHandleMessages } from '@hooks';
import { WatchList, ChatList } from '@components';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';

interface SideListTypes {
  videos: any;
  removeVideoFromList: any;
  socket: any;
  usersCount: number;
}

const SideList = ({ videos, removeVideoFromList, socket, usersCount }: SideListTypes): JSX.Element => {
  // @ts-ignore
  const { user } = React.useContext(UserContext);

  const { messages, sendMessage, userIsTyping, isTypingMessage } = useHandleMessages(socket, user);

  return (
    <div className="flex flex-col h-full">
      {/* Header with user count */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-muted/30">
        <span className="text-sm font-medium text-muted-foreground">Room Activity</span>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Users className="w-4 h-4 text-green-500" />
            <span className="font-medium">{usersCount}</span>
            <span className="text-xs">watching</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="videos" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="w-full rounded-none border-b border-border/50 bg-transparent h-12 p-0">
          <TabsTrigger
            value="videos"
            className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-purple-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none h-full gap-2"
          >
            <ListVideo className="w-4 h-4" />
            Queue
            {videos.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                {videos.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="chat"
            className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-purple-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none h-full gap-2"
          >
            <MessageCircle className="w-4 h-4" />
            Chat
            {messages.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                {messages.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="videos" className="flex-1 overflow-hidden m-0 data-[state=inactive]:hidden">
          <WatchList videos={videos} removeVideo={removeVideoFromList} />
        </TabsContent>

        <TabsContent value="chat" className="flex-1 overflow-hidden m-0 data-[state=inactive]:hidden">
          <ChatList
            socket={socket}
            messages={messages}
            sendMessage={sendMessage}
            userIsTyping={userIsTyping}
            isTypingMessage={isTypingMessage}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SideList;
