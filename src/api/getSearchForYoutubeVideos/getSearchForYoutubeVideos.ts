import { request } from '@api';

const WORKING_VIDEO_INITIAL_STATE = {
  videoId: 'OHviieMFY0c',
  channel: 'Joma Tech',
  description:
    'Learn how to code with Python 3 for Data Science and Software Engineering. High-quality video courses: https://python.jomaclass.com/ ▻ Chat with me on ...',
  url: 'https://www.youtube.com/watch?v=OHviieMFY0c',
  name: 'Cool Kids Code In Javascript (PART 3)',
  img: 'https://i.ytimg.com/vi/OHviieMFY0c/default.jpg',
};

const getSearchForYoutubeVideos = (searchTerm: string) => {
  // return request({ endpoint: `youtube?q=${encodeURIComponent(searchTerm)}` });
  return [WORKING_VIDEO_INITIAL_STATE];
};

export default getSearchForYoutubeVideos;
