/* eslint-disable */
import React from 'react';
import { IconButton, Avatar, ListItemText, Snackbar } from '@material-ui/core';
import { Alert, TextField } from '@mui/material';
import { AddToQueue } from '@material-ui/icons';
import { useSnackbar } from 'notistack';
import { useDebounce, useGetSearchForYoutubeVideos } from '@hooks';
import { OptionsList } from '@components';
import './AddVideoBar.css';

// ! TEMP: For testing
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

interface VideoTypes {
  videoId: string;
  channel: string;
  description: string;
  url: string;
  name: string;
  img: string;
}
interface BarTypes {
  addVideoToList: any;
}

const AddVideoBar = ({ addVideoToList }: BarTypes): JSX.Element => {
  const { enqueueSnackbar } = useSnackbar();

  const [search, setSearch] = React.useState(WORKING_VIDEO_INITIAL_STATE.url);
  const [video, setVideo] = React.useState(WORKING_VIDEO_INITIAL_STATE);

  const [options, setOptions] = React.useState([]);
  const [showOptions, setShowOptions] = React.useState(false);

  const debouncedSearchQuery = useDebounce(search);

  const youtubeVideosSearchResults = useGetSearchForYoutubeVideos({
    searchTerm: debouncedSearchQuery,
    configOptions: {
      onSuccess: (data: any) => {
        console.log(data);

        setOptions(data);
        setShowOptions(true);
      },
      onError: (error: any) => {
        console.error(`[useGetSearchForYoutubeVideos]: `, error);
        console.error(error);
        enqueueSnackbar(error, { variant: 'error' });
      },
    },
  });

  const handleChange = (e: any) => {
    setSearch(e.target.value);
  };

  const handleSubmit = React.useCallback(
    (e: any) => {
      if (e.keyCode === 13 || e.type === 'submit') {
        console.log(e);

        e.preventDefault();
        addVideoToList(video);
        // setSearch('');
        setVideo(VIDEO_INITIAL_STATE);
        setShowOptions(false);
      }
    },
    [search, addVideoToList],
  );

  const handleClick = (option: VideoTypes) => {
    // setSearch(option.url);
    // setVideo(option);
    addVideoToList(option);
    setShowOptions(false);
    // setOptions([]);
  };

  return (
    <form
      className="Add-Video-Form"
      // onSubmit={handleSubmit}
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
      {/* {video.img && (
				<div className="Add-Video__Preview">
					<Avatar
						style={{ width: '80px', height: '100%', objectFit: 'contain' }}
						variant="square"
						alt={video.img}
						src={video.img}
					/>
					<ListItemText primary={video.name} secondary={video.description} />
				</div>
			)}

			<IconButton
				type="submit"
				aria-label="add to queue"
				className="form-btn-icon">
				<AddToQueue />
			</IconButton> */}
    </form>
  );
};

export default AddVideoBar;
