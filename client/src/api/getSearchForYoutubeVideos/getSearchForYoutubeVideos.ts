import { request } from '..';

const getSearchForYoutubeVideos = (searchTerm: string) => {
  return request({ endpoint: `youtube?q=${encodeURIComponent(searchTerm)}` });
};

export default getSearchForYoutubeVideos;
