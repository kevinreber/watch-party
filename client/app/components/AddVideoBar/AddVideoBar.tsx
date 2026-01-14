import { useState, FormEvent, ChangeEvent } from "react";
import { TextField, Button, Box } from "@mui/material";
import { useSnackbar } from "notistack";
import AddIcon from "@mui/icons-material/Add";

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
  const [url, setUrl] = useState("");

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const videoId = getYouTubeId(url);
    if (!videoId) {
      enqueueSnackbar("Please enter a valid YouTube URL", { variant: "warning" });
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
    setUrl("");
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        display: "flex",
        gap: 2,
        width: "100%",
        marginBottom: "2rem",
        alignItems: "center",
      }}
    >
      <TextField
        name="url"
        value={url}
        onChange={handleChange}
        placeholder="Paste YouTube URL here..."
        size="small"
        fullWidth
      />
      <Button
        type="submit"
        variant="contained"
        startIcon={<AddIcon />}
        disabled={!url.trim()}
      >
        Add
      </Button>
    </Box>
  );
};
