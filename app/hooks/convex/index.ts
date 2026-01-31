// Re-export all Convex hooks for easy importing
export { useRoom, useCreateRoom, usePublicRooms } from "./useRoom";
export { useMessages, useReactions } from "./useMessages";
export { useVideoSync } from "./useVideoSync";
export { usePolls, useUserVote } from "./usePolls";
export { useFriends, useSearchUsers } from "./useFriends";
export { useNotifications } from "./useNotifications";
export {
  useWatchHistory,
  useRoomHistory,
  useFavoriteVideos,
  useRoomBookmarks,
} from "./useHistory";

// Re-export the auth hook
export { useConvexAuth } from "../../context/ConvexAuthContext";
