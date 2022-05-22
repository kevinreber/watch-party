/* eslint-disable */
// Dependencies
import React, { useState, useCallback } from 'react';
import Api from '../../api/api';
import './AddVideoBar.css';

// Components
import { OptionsList } from '@components';
import { debounce } from '@utils';

// MUI
import { IconButton, Avatar, ListItemText } from '@material-ui/core';
import { TextField } from '@mui/material';
import { AddToQueue } from '@material-ui/icons';

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
  const [search, setSearch] = useState(WORKING_VIDEO_INITIAL_STATE.url);
  const [video, setVideo] = useState(WORKING_VIDEO_INITIAL_STATE);

  const [options, setOptions] = useState([]);
  const [showOptions, setShowOptions] = useState(false);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);

  let debounced: any = null;

  const handleChange = (e: any) => {
    // if value is not empty
    if (e.target.value) setShowOptions(true);
    else setShowOptions(false);

    setSearch(e.target.value);
    if (!debounced) {
      debounced = debounce(async () => {
        setIsLoadingOptions(true);
        await Api.searchForYoutubeVideos(e.target.value)
          .then((data) => setOptions(data))
          .catch((err) => console.error(err))
          .finally(() => setIsLoadingOptions(false));
      }, 500);
    }
    debounced();
  };

  const handleSubmit = useCallback(
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
      {showOptions && <OptionsList options={options} handleClick={handleClick} isLoading={isLoadingOptions} />}
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
