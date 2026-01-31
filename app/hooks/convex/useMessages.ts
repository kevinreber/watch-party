import { useQuery, useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";

export function useMessages(roomId: Id<"rooms"> | null, limit?: number) {
  const messages = useQuery(
    api.messages.getMessages,
    roomId ? { roomId, limit } : "skip"
  );

  const sendMessage = useMutation(api.messages.sendMessage);

  return {
    messages: messages || [],
    sendMessage,
    isLoading: messages === undefined,
  };
}

export function useReactions(roomId: Id<"rooms"> | null) {
  const reactions = useQuery(
    api.messages.getReactions,
    roomId ? { roomId } : "skip"
  );

  const sendReaction = useMutation(api.messages.sendReaction);

  return {
    reactions: reactions || [],
    sendReaction,
  };
}
