import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

export function useRoom(roomId: Id<"rooms"> | null) {
  const room = useQuery(
    api.rooms.getRoom,
    roomId ? { roomId } : "skip"
  );

  const members = useQuery(
    api.rooms.getRoomMembers,
    roomId ? { roomId } : "skip"
  );

  const joinRoom = useMutation(api.rooms.joinRoom);
  const leaveRoom = useMutation(api.rooms.leaveRoom);
  const updateRoom = useMutation(api.rooms.updateRoom);
  const setTyping = useMutation(api.rooms.setTyping);
  const transferOwnership = useMutation(api.rooms.transferOwnership);

  return {
    room,
    members,
    joinRoom,
    leaveRoom,
    updateRoom,
    setTyping,
    transferOwnership,
    isLoading: room === undefined,
  };
}

export function useCreateRoom() {
  return useMutation(api.rooms.createRoom);
}

export function usePublicRooms() {
  return useQuery(api.rooms.listPublicRooms);
}
