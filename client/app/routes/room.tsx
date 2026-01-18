import { useContext } from "react";
import { useParams, useNavigate } from "react-router";
import { Tv2, ArrowLeft, Users } from "lucide-react";
import { UserContext } from "~/context/UserContext";
import {
  useGetWebSocket,
  useHandleVideoList,
  useGetUserCount,
  useLoadYouTubeScript,
} from "~/hooks";
import {
  PageContainer,
  VideoPlayer,
  AddVideoBar,
  SideList,
} from "~/components";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";

export default function Room() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(UserContext);

  const { socket } = useGetWebSocket(user);
  const { usersCount } = useGetUserCount(socket);
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
              onClick={() => navigate("/")}
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
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Users className="w-4 h-4 text-green-500" />
              <span className="font-medium">{usersCount}</span>
            </div>
            <Badge variant="outline" className="px-3 py-1 border-purple-500/30 text-purple-400">
              {roomId}
            </Badge>
          </div>
        </div>
      </header>

      <PageContainer>
        <div className="py-6">
          {/* Search bar */}
          <div className="mb-6">
            <AddVideoBar addVideoToList={addVideoToList} />
          </div>

          {/* Main content */}
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Video player section - 70% */}
            <div className="w-full lg:w-[70%]">
              <div className="rounded-xl overflow-hidden bg-card border border-border/50 shadow-2xl">
                <VideoPlayer curVideo={videos[0]} />
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
        </div>
      </PageContainer>
    </div>
  );
}
