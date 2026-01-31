import { useQuery, useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";

export function usePolls(roomId: Id<"rooms"> | null) {
  const polls = useQuery(api.polls.getPolls, roomId ? { roomId } : "skip");

  const activePoll = useQuery(
    api.polls.getActivePoll,
    roomId ? { roomId } : "skip"
  );

  const createPoll = useMutation(api.polls.createPoll);
  const vote = useMutation(api.polls.vote);
  const endPoll = useMutation(api.polls.endPoll);
  const deletePoll = useMutation(api.polls.deletePoll);
  const createWatchNextPoll = useMutation(api.polls.createWatchNextPoll);

  return {
    polls: polls || [],
    activePoll,
    isLoading: polls === undefined,
    createPoll: (question: string, options: string[], endsAt?: number) =>
      roomId && createPoll({ roomId, question, options, endsAt }),
    vote,
    endPoll,
    deletePoll,
    createWatchNextPoll: (
      videoOptions: Array<{ videoId: string; name: string }>
    ) => roomId && createWatchNextPoll({ roomId, videoOptions }),
  };
}

export function useUserVote(pollId: Id<"polls"> | null) {
  return useQuery(api.polls.getUserVote, pollId ? { pollId } : "skip");
}
