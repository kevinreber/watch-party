import ReactPlayer from "react-player/youtube";
import { Play, Video } from "lucide-react";

interface VideoType {
  videoId: string;
  url: string;
  name: string;
  channel?: string;
  description?: string;
  img?: string;
}

interface VideoPlayerProps {
  curVideo: VideoType | undefined;
}

export const VideoPlayer = ({ curVideo }: VideoPlayerProps) => {
  if (!curVideo) {
    return (
      <div className="w-full aspect-video flex flex-col items-center justify-center bg-black/50 rounded-xl border border-white/10 gap-4">
        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center">
          <Video className="w-10 h-10 text-purple-400" />
        </div>
        <div className="text-center px-4">
          <h3 className="text-lg font-semibold text-white mb-2">
            No video playing
          </h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Add a video to the queue to start watching together
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full aspect-video rounded-xl overflow-hidden bg-black shadow-2xl shadow-purple-500/10">
      <ReactPlayer
        url={curVideo.url}
        width="100%"
        height="100%"
        controls
        playing
        config={{
          youtube: {
            playerVars: {
              autoplay: 1,
              modestbranding: 1,
            },
          },
        }}
      />
    </div>
  );
};
