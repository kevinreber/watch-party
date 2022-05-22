import { request } from '..';

const getSearchForYoutubeVideos = (query: string) => {
  return request({ endpoint: `youtube?q=${encodeURIComponent(query)}` });
};

export default getSearchForYoutubeVideos;
