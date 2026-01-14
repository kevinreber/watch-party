/* eslint-disable */
import React from 'react';
import { Search, Loader2 } from 'lucide-react';
import { useSnackbar } from 'notistack';
import { useDebounce, useGetSearchForYoutubeVideos } from '@hooks';
import { OptionsList } from '@components';
import { VideoTypes } from '@types';
import { Input } from '../ui/input';

const WORKING_VIDEO_INITIAL_STATE = {
  videoId: 'OHviieMFY0c',
  channel: 'Joma Tech',
  description:
    'Learn how to code with Python 3 for Data Science and Software Engineering. High-quality video courses: https://python.jomaclass.com/ ▻ Chat with me on ...',
  url: 'https://www.youtube.com/watch?v=OHviieMFY0c',
  name: 'Cool Kids Code In Javascript (PART 3)',
  img: 'https://i.ytimg.com/vi/OHviieMFY0c/default.jpg',
};

const VIDEO_INITIAL_STATE = {
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

  const [search, setSearch] = React.useState(WORKING_VIDEO_INITIAL_STATE.url);
  const [video, setVideo] = React.useState(WORKING_VIDEO_INITIAL_STATE);

  const [options, setOptions] = React.useState([]);
  const [showOptions, setShowOptions] = React.useState(false);
  const [isFocused, setIsFocused] = React.useState(false);

  const containerRef = React.useRef<HTMLDivElement>(null);

  const debouncedSearchQuery = useDebounce(search);

  const youtubeVideosSearchResults = useGetSearchForYoutubeVideos({
    searchTerm: debouncedSearchQuery,
    configOptions: {
      onSuccess: (data: any) => {
        setOptions(data);
        setShowOptions(true);
      },
      onError: (error: any) => {
        console.error(`[useGetSearchForYoutubeVideos]: `, error);
        enqueueSnackbar(error, { variant: 'error' });
      },
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const handleSubmit = React.useCallback(
    (e: any) => {
      if (e.keyCode === 13 || e.type === 'submit') {
        e.preventDefault();
        addVideoToList(video);
        setVideo(VIDEO_INITIAL_STATE);
        setShowOptions(false);
      }
    },
    [search, addVideoToList],
  );

  const handleClick = (option: VideoTypes) => {
    addVideoToList(option);
    setShowOptions(false);
  };

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowOptions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        {youtubeVideosSearchResults.isLoading && (
          <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground animate-spin" />
        )}
        <Input
          name="search"
          id="video-search"
          value={search}
          onChange={handleChange}
          onKeyDown={handleSubmit}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Search for videos or paste a YouTube URL..."
          className="w-full h-12 pl-12 pr-12 text-base bg-card border-border/50 rounded-xl focus:ring-2 focus:ring-purple-500/50 transition-all"
        />
      </div>

      {showOptions && options.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50">
          <OptionsList
            options={options}
            handleClick={handleClick}
            isLoading={youtubeVideosSearchResults.isLoading}
          />
        </div>
      )}
    </div>
  );
};

export default AddVideoBar;
