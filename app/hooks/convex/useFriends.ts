import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

export function useFriends() {
  const friends = useQuery(api.friends.getFriends);
  const pendingRequests = useQuery(api.friends.getPendingRequests);
  const sentRequests = useQuery(api.friends.getSentRequests);

  const sendFriendRequest = useMutation(api.friends.sendFriendRequest);
  const acceptFriendRequest = useMutation(api.friends.acceptFriendRequest);
  const rejectFriendRequest = useMutation(api.friends.rejectFriendRequest);
  const removeFriend = useMutation(api.friends.removeFriend);
  const inviteFriendToRoom = useMutation(api.friends.inviteFriendToRoom);

  return {
    friends: friends || [],
    pendingRequests: pendingRequests || [],
    sentRequests: sentRequests || [],
    isLoading: friends === undefined,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend,
    inviteFriendToRoom,
  };
}

export function useSearchUsers() {
  const searchUsers = useQuery(api.users.searchUsers, { query: "" });
  return searchUsers || [];
}
