import React from 'react';
import { useParams } from 'react-router-dom';
import { Tv2, ArrowLeft } from 'lucide-react';
import { VideoPlayer, AddVideoBar, SideList, PageContainer } from '@components';
import { UserContext } from '@context';
import { useGetUserCount, useGetWebSocket, useHandleMessages, useHandleVideoList, useLoadYouTubeScript } from '@hooks';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';

const Room = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { user } = React.useContext<any>(UserContext);

  const { socket } = useGetWebSocket(user);
  const { usersCount } = useGetUserCount(socket);
  const { appendMessage } = useHandleMessages(socket, user);
  const { videos, addVideoToList, removeVideoFromList } = useHandleVideoList(socket);

  useLoadYouTubeScript();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between max-w-7xl">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.history.back()}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500">
                <Tv2 className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-lg gradient-text">Watch Party</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="px-3 py-1 border-purple-500/30 text-purple-400">
              Room: {roomId}
            </Badge>
          </div>
        </div>
      </header>

      <PageContainer>
        <>
          {/* Search bar */}
          <div className="mb-6">
            <AddVideoBar addVideoToList={addVideoToList} />
          </div>

          {/* Main content */}
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Video player section - 70% */}
            <div className="w-full lg:w-[70%]">
              <div className="rounded-xl overflow-hidden bg-card border border-border/50 shadow-2xl">
                <VideoPlayer
                  curVideo={videos[0]}
                  socket={socket}
                  addMessage={appendMessage}
                  username={user}
                />
              </div>
            </div>

            {/* Sidebar - 30% */}
            <div className="w-full lg:w-[30%]">
              <div className="rounded-xl bg-card border border-border/50 shadow-xl h-[600px] flex flex-col overflow-hidden">
                <SideList
                  videos={videos}
                  removeVideoFromList={removeVideoFromList}
                  socket={socket}
                  usersCount={usersCount}
                />
              </div>
            </div>
          </div>
        </>
      </PageContainer>
    </div>
  );
};

export default Room;
