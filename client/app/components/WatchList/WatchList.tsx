import { Trash2, Play, ListVideo } from "lucide-react";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

interface Video {
  videoId: string;
  url: string;
  name: string;
  channel?: string;
  description?: string;
  img?: string;
}

interface WatchListProps {
  videos: Video[];
  removeVideo: (video: Video) => void;
}

export const WatchList = ({ videos, removeVideo }: WatchListProps) => {
  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-3">
        {videos.length > 0 ? (
          videos.map((video, index) => (
            <div
              key={video.videoId}
              className={cn(
                "group relative flex gap-3 p-3 rounded-lg transition-all duration-200",
                index === 0
                  ? "bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20"
                  : "bg-muted/30 hover:bg-muted/50"
              )}
            >
              {/* Thumbnail */}
              <div className="relative shrink-0 w-24 h-14 rounded-md overflow-hidden bg-black">
                {video.img ? (
                  <img
                    src={video.img}
                    alt={video.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ListVideo className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
                {index === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center">
                      <Play className="w-4 h-4 text-black fill-black ml-0.5" />
                    </div>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="font-medium text-sm line-clamp-1">{video.name}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                      {video.channel || video.description}
                    </p>
                  </div>
                </div>
                {index === 0 && (
                  <span className="inline-flex items-center gap-1 text-xs text-purple-400 mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                    Now Playing
                  </span>
                )}
              </div>

              {/* Delete Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeVideo(video)}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
            <ListVideo className="w-12 h-12 mb-2 opacity-50" />
            <p className="text-sm">No videos in queue</p>
            <p className="text-xs">Search and add videos to get started</p>
          </div>
        )}
      </div>
    </ScrollArea>
  );
};
