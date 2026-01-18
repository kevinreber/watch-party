import { useState, FormEvent, ChangeEvent, useEffect } from "react";
import {
  TextField,
  Button,
  Box,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  IconButton,
  CircularProgress,
  Paper,
} from "@mui/material";
import { useSnackbar } from "notistack";
import AddIcon from "@mui/icons-material/Add";
import AddToQueueIcon from "@mui/icons-material/AddToQueue";

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
    <Box sx={{ width: "100%", marginBottom: "2rem", position: "relative" }}>
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          display: "flex",
          gap: 2,
          alignItems: "center",
        }}
      >
        <TextField
          name="search"
          value={searchQuery}
          onChange={handleChange}
          placeholder="Search YouTube videos or paste URL..."
          size="small"
          fullWidth
        />
        <Button
          type="submit"
          variant="contained"
          startIcon={<AddIcon />}
          disabled={!searchQuery.trim()}
        >
          Add
        </Button>
      </Box>

      {/* Search Results Dropdown */}
      {showResults && (
        <Paper
          sx={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            maxHeight: "400px",
            overflow: "auto",
            zIndex: 1000,
            mt: 1,
          }}
        >
          <List>
            {isSearching ? (
              <ListItem>
                <CircularProgress size={24} />
                <ListItemText primary="Searching..." sx={{ ml: 2 }} />
              </ListItem>
            ) : searchResults.length > 0 ? (
              searchResults.map((video) => (
                <ListItem
                  key={video.videoId}
                  sx={{
                    "&:hover": { backgroundColor: "action.hover" },
                  }}
                >
                  <ListItemAvatar>
                    <Avatar variant="square" src={video.img} alt={video.name} />
                  </ListItemAvatar>
                  <ListItemText
                    primary={video.name}
                    secondary={video.description}
                    secondaryTypographyProps={{
                      sx: {
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                      },
                    }}
                  />
                  <IconButton
                    onClick={() => handleSelectVideo(video)}
                    color="primary"
                    edge="end"
                  >
                    <AddToQueueIcon />
                  </IconButton>
                </ListItem>
              ))
            ) : (
              <ListItem>
                <ListItemText primary="No results found" />
              </ListItem>
            )}
          </List>
        </Paper>
      )}
    </Box>
  );
};
