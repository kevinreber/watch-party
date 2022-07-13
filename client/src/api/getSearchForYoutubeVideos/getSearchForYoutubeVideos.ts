import { request } from '@api';

const getSearchForYoutubeVideos = (searchTerm: string) => {
  return request({ endpoint: `youtube?q=${encodeURIComponent(searchTerm)}` });
};

export default getSearchForYoutubeVideos;
