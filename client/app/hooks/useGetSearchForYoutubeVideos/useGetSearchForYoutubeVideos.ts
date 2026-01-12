import { useQuery } from '@tanstack/react-query';
import { getSearchForYoutubeVideos } from '@api';

const MIN_LENGTH = 3;

const useGetSearchForYoutubeVideos = ({
  searchTerm,
}: {
  searchTerm: string;
}) => {
  const response = useQuery({
    queryKey: ['useGetSearchForYoutubeVideos', searchTerm],
    queryFn: () => getSearchForYoutubeVideos(searchTerm),
    enabled: searchTerm.length >= MIN_LENGTH,
  });

  return response;
};

export default useGetSearchForYoutubeVideos;
