// Poll Service
import type { Poll, PollOption } from "~/types";
import { mockAuth } from "./mockAuth";

// Generate a unique ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// In-memory poll storage (would be shared via socket in real app)
let polls: Map<string, Poll[]> = new Map();

export const pollService = {
  // Get polls for a room
  getPolls(roomId: string): Poll[] {
    return polls.get(roomId) || [];
  },

  // Get active poll for a room
  getActivePoll(roomId: string): Poll | null {
    const roomPolls = pollService.getPolls(roomId);
    return roomPolls.find(p => p.isActive) || null;
  },

  // Create a poll
  createPoll(
    roomId: string,
    question: string,
    options: string[],
    durationMinutes?: number
  ): Poll {
    const currentUser = mockAuth.getCurrentUser();
    const now = new Date();

    const poll: Poll = {
      id: generateId(),
      question,
      options: options.map(text => ({
        id: generateId(),
        text,
        votes: 0,
        voters: [],
      })),
      createdBy: currentUser?.id || "anonymous",
      creatorName: currentUser?.username || "Anonymous",
      createdAt: now.toISOString(),
      endsAt: durationMinutes
        ? new Date(now.getTime() + durationMinutes * 60 * 1000).toISOString()
        : undefined,
      isActive: true,
      totalVotes: 0,
    };

    const roomPolls = pollService.getPolls(roomId);
    // Deactivate other polls
    roomPolls.forEach(p => p.isActive = false);
    roomPolls.push(poll);
    polls.set(roomId, roomPolls);

    return poll;
  },

  // Vote on a poll
  vote(roomId: string, pollId: string, optionId: string): Poll | null {
    const currentUser = mockAuth.getCurrentUser();
    const userId = currentUser?.id || "anonymous";

    const roomPolls = pollService.getPolls(roomId);
    const pollIndex = roomPolls.findIndex(p => p.id === pollId);

    if (pollIndex === -1) return null;

    const poll = roomPolls[pollIndex];

    // Check if user already voted
    const hasVoted = poll.options.some(o => o.voters.includes(userId));
    if (hasVoted) return poll;

    // Find option and add vote
    const optionIndex = poll.options.findIndex(o => o.id === optionId);
    if (optionIndex === -1) return null;

    poll.options[optionIndex].votes++;
    poll.options[optionIndex].voters.push(userId);
    poll.totalVotes++;

    roomPolls[pollIndex] = poll;
    polls.set(roomId, roomPolls);

    return poll;
  },

  // End a poll
  endPoll(roomId: string, pollId: string): Poll | null {
    const roomPolls = pollService.getPolls(roomId);
    const pollIndex = roomPolls.findIndex(p => p.id === pollId);

    if (pollIndex === -1) return null;

    roomPolls[pollIndex].isActive = false;
    polls.set(roomId, roomPolls);

    return roomPolls[pollIndex];
  },

  // Delete a poll
  deletePoll(roomId: string, pollId: string): void {
    const roomPolls = pollService.getPolls(roomId);
    const filtered = roomPolls.filter(p => p.id !== pollId);
    polls.set(roomId, filtered);
  },

  // Check if user has voted
  hasUserVoted(poll: Poll, userId?: string): boolean {
    const currentUser = mockAuth.getCurrentUser();
    const id = userId || currentUser?.id || "anonymous";
    return poll.options.some(o => o.voters.includes(id));
  },

  // Get user's vote
  getUserVote(poll: Poll, userId?: string): PollOption | null {
    const currentUser = mockAuth.getCurrentUser();
    const id = userId || currentUser?.id || "anonymous";
    return poll.options.find(o => o.voters.includes(id)) || null;
  },

  // Get winning option(s)
  getWinningOptions(poll: Poll): PollOption[] {
    const maxVotes = Math.max(...poll.options.map(o => o.votes));
    if (maxVotes === 0) return [];
    return poll.options.filter(o => o.votes === maxVotes);
  },

  // Create "What to watch next?" poll from videos
  createWatchNextPoll(roomId: string, videoOptions: Array<{ name: string; videoId: string }>): Poll {
    return pollService.createPoll(
      roomId,
      "What should we watch next?",
      videoOptions.map(v => v.name),
      5 // 5 minute duration
    );
  },

  // Clear all polls for a room
  clearRoomPolls(roomId: string): void {
    polls.delete(roomId);
  },
};
