import { useState, FormEvent, ChangeEvent, useEffect } from "react";
import { useSnackbar } from "notistack";
import { Plus, ListPlus, Search, Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card } from "../ui/card";
import { ScrollArea } from "../ui/scroll-area";
import { cn } from "~/lib/utils";

interface Video {
  videoId: string;
  url: string;
  name: string;
  channel?: string;
  description?: string;
  img?: string;
}

interface AddVideoBarProps {
  addVideoToList: (video: Video) => void;
}

// Extract YouTube video ID from URL
const getYouTubeId = (url: string): string | null => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

export const AddVideoBar = ({ addVideoToList }: AddVideoBarProps) => {
  const { enqueueSnackbar } = useSnackbar();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Video[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 600);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Perform search when debounced query changes
  useEffect(() => {
    const searchVideos = async () => {
      if (debouncedQuery.length < 3) {
        setSearchResults([]);
        setShowResults(false);
        return;
      }

      // Check if it's a YouTube URL - if so, don't search
      const videoId = getYouTubeId(debouncedQuery);
      if (videoId) {
        setSearchResults([]);
        setShowResults(false);
        return;
      }

      setIsSearching(true);
      try {
        const response = await fetch(`/api/youtube?q=${encodeURIComponent(debouncedQuery)}`);
        const data = await response.json();
        setSearchResults(data);
        setShowResults(true);
      } catch (error) {
        console.error("Search error:", error);
        enqueueSnackbar("Failed to search videos", { variant: "error" });
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    searchVideos();
  }, [debouncedQuery, enqueueSnackbar]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const videoId = getYouTubeId(searchQuery);
    if (!videoId) {
      enqueueSnackbar("Please search for a video or paste a valid YouTube URL", {
        variant: "warning",
      });
      return;
    }

    const video: Video = {
      videoId,
      url: `https://www.youtube.com/watch?v=${videoId}`,
      name: `Video ${videoId}`,
      description: "YouTube video",
      img: `https://img.youtube.com/vi/${videoId}/default.jpg`,
    };

    addVideoToList(video);
    setSearchQuery("");
    setShowResults(false);
  };

  const handleSelectVideo = (video: Video) => {
    addVideoToList(video);
    setSearchQuery("");
    setShowResults(false);
    setSearchResults([]);
  };

  return (
    <div className="w-full mb-6 relative">
      <form onSubmit={handleSubmit} className="flex gap-3 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            name="search"
            value={searchQuery}
            onChange={handleChange}
            placeholder="Search YouTube videos or paste URL..."
            className="pl-10 bg-white/5 border-white/10 focus:border-purple-500/50 focus:ring-purple-500/20"
          />
        </div>
        <Button
          type="submit"
          disabled={!searchQuery.trim()}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 gap-2"
        >
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </form>

      {/* Search Results Dropdown */}
      {showResults && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 bg-gray-900/95 border-white/10 backdrop-blur-xl overflow-hidden">
          <ScrollArea className="max-h-[400px]">
            {isSearching ? (
              <div className="flex items-center gap-3 p-4">
                <Loader2 className="h-5 w-5 animate-spin text-purple-500" />
                <span className="text-sm text-muted-foreground">Searching...</span>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="divide-y divide-white/5">
                {searchResults.map((video) => (
                  <div
                    key={video.videoId}
                    className={cn(
                      "flex items-center gap-3 p-3",
                      "hover:bg-white/5 transition-colors cursor-pointer group"
                    )}
                    onClick={() => handleSelectVideo(video)}
                  >
                    <div className="flex-shrink-0 w-20 h-14 rounded-md overflow-hidden bg-black/50">
                      {video.img && (
                        <img
                          src={video.img}
                          alt={video.name}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {video.name}
                      </p>
                      {video.channel && (
                        <p className="text-xs text-muted-foreground truncate">
                          {video.channel}
                        </p>
                      )}
                      {video.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                          {video.description}
                        </p>
                      )}
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-purple-400 hover:text-purple-300 hover:bg-purple-500/20"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectVideo(video);
                      }}
                    >
                      <ListPlus className="h-5 w-5" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No results found
              </div>
            )}
          </ScrollArea>
        </Card>
      )}
    </div>
  );
};
