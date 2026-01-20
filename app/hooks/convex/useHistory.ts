import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

export function useWatchHistory(limit?: number) {
  const watchHistory = useQuery(api.history.getWatchHistory, { limit });
  const addToWatchHistory = useMutation(api.history.addToWatchHistory);

  return {
    watchHistory: watchHistory || [],
    isLoading: watchHistory === undefined,
    addToWatchHistory,
  };
}

export function useRoomHistory(limit?: number) {
  const roomHistory = useQuery(api.history.getRoomHistory, { limit });
  const addToRoomHistory = useMutation(api.history.addToRoomHistory);

  return {
    roomHistory: roomHistory || [],
    isLoading: roomHistory === undefined,
    addToRoomHistory,
  };
}

export function useFavoriteVideos() {
  const favoriteVideos = useQuery(api.history.getFavoriteVideos);
  const addFavoriteVideo = useMutation(api.history.addFavoriteVideo);
  const removeFavoriteVideo = useMutation(api.history.removeFavoriteVideo);

  return {
    favoriteVideos: favoriteVideos || [],
    isLoading: favoriteVideos === undefined,
    addFavoriteVideo,
    removeFavoriteVideo,
  };
}

export function useRoomBookmarks() {
  const roomBookmarks = useQuery(api.history.getRoomBookmarks);
  const addRoomBookmark = useMutation(api.history.addRoomBookmark);
  const removeRoomBookmark = useMutation(api.history.removeRoomBookmark);
  const updateBookmarkLastVisited = useMutation(
    api.history.updateBookmarkLastVisited
  );

  return {
    roomBookmarks: roomBookmarks || [],
    isLoading: roomBookmarks === undefined,
    addRoomBookmark,
    removeRoomBookmark,
    updateBookmarkLastVisited,
  };
}
