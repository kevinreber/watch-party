import { useState, useCallback, useEffect } from 'react';
import { TextField } from '@mui/material';
import { useSnackbar } from 'notistack';
import { useDebounce, useGetSearchForYoutubeVideos } from '@hooks';
import { OptionsList } from '@components';
import { VideoTypes } from '@types';
import './AddVideoBar.css';

// TEMP: For testing
const WORKING_VIDEO_INITIAL_STATE: VideoTypes = {
  videoId: 'OHviieMFY0c',
  channel: 'Joma Tech',
  description:
    'Learn how to code with Python 3 for Data Science and Software Engineering. High-quality video courses: https://python.jomaclass.com/',
  url: 'https://www.youtube.com/watch?v=OHviieMFY0c',
  name: 'Cool Kids Code In Javascript (PART 3)',
  img: 'https://i.ytimg.com/vi/OHviieMFY0c/default.jpg',
};

const VIDEO_INITIAL_STATE: VideoTypes = {
  videoId: '',
  channel: '',
  description: '',
  url: '',
  name: '',
  img: '',
};

interface BarTypes {
  addVideoToList: (video: VideoTypes) => void;
}

const AddVideoBar = ({ addVideoToList }: BarTypes): JSX.Element => {
  const { enqueueSnackbar } = useSnackbar();

  const [search, setSearch] = useState(WORKING_VIDEO_INITIAL_STATE.url);
  const [video, setVideo] = useState(WORKING_VIDEO_INITIAL_STATE);

  const [options, setOptions] = useState<VideoTypes[]>([]);
  const [showOptions, setShowOptions] = useState(false);

  const debouncedSearchQuery = useDebounce(search);

  const youtubeVideosSearchResults = useGetSearchForYoutubeVideos({
    searchTerm: debouncedSearchQuery,
  });

  // Handle query success/error with useEffect (TanStack Query v5 pattern)
  useEffect(() => {
    if (youtubeVideosSearchResults.data) {
      console.log(youtubeVideosSearchResults.data);
      setOptions(youtubeVideosSearchResults.data as VideoTypes[]);
      setShowOptions(true);
    }
  }, [youtubeVideosSearchResults.data]);

  useEffect(() => {
    if (youtubeVideosSearchResults.error) {
      console.error(`[useGetSearchForYoutubeVideos]: `, youtubeVideosSearchResults.error);
      enqueueSnackbar(String(youtubeVideosSearchResults.error), { variant: 'error' });
    }
  }, [youtubeVideosSearchResults.error, enqueueSnackbar]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const handleSubmit = useCallback(
    (e: React.KeyboardEvent | React.FormEvent) => {
      if (('keyCode' in e && e.keyCode === 13) || e.type === 'submit') {
        console.log(e);

        e.preventDefault();
        addVideoToList(video);
        setVideo(VIDEO_INITIAL_STATE);
        setShowOptions(false);
      }
    },
    [video, addVideoToList]
  );

  const handleClick = (option: VideoTypes) => {
    addVideoToList(option);
    setShowOptions(false);
  };

  return (
    <form
      className="Add-Video-Form"
      style={{ width: '100%', marginBottom: '3rem' }}
    >
      <TextField
        name="id"
        id="video-id"
        value={search}
        onChange={handleChange}
        onKeyDown={handleSubmit}
        className="form-input"
        size="small"
      />
      {showOptions && (
        <OptionsList options={options} handleClick={handleClick} isLoading={youtubeVideosSearchResults.isLoading} />
      )}
    </form>
  );
};

export default AddVideoBar;
