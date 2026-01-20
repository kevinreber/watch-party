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

  // Vote on a poll (supports changing vote or removing vote by clicking same option)
  vote(roomId: string, pollId: string, optionId: string): Poll | null {
    const currentUser = mockAuth.getCurrentUser();
    const userId = currentUser?.id || "anonymous";

    const roomPolls = pollService.getPolls(roomId);
    const pollIndex = roomPolls.findIndex(p => p.id === pollId);

    if (pollIndex === -1) return null;

    const poll = roomPolls[pollIndex];

    // Find current vote (if any)
    const currentVoteOptionIndex = poll.options.findIndex(o => o.voters.includes(userId));
    const targetOptionIndex = poll.options.findIndex(o => o.id === optionId);

    if (targetOptionIndex === -1) return null;

    // Create a deep copy of options to ensure React detects the change
    const newOptions = poll.options.map((opt, idx) => ({
      ...opt,
      voters: [...opt.voters],
    }));

    let newTotalVotes = poll.totalVotes;

    // If user clicked on the same option they already voted for, remove the vote
    if (currentVoteOptionIndex !== -1 && poll.options[currentVoteOptionIndex].id === optionId) {
      newOptions[currentVoteOptionIndex].votes--;
      newOptions[currentVoteOptionIndex].voters = newOptions[currentVoteOptionIndex].voters.filter(v => v !== userId);
      newTotalVotes--;
    }
    // If user has voted on a different option, change their vote
    else if (currentVoteOptionIndex !== -1) {
      // Remove from old option
      newOptions[currentVoteOptionIndex].votes--;
      newOptions[currentVoteOptionIndex].voters = newOptions[currentVoteOptionIndex].voters.filter(v => v !== userId);
      // Add to new option
      newOptions[targetOptionIndex].votes++;
      newOptions[targetOptionIndex].voters.push(userId);
      // Total votes stays the same
    }
    // If user hasn't voted, add their vote
    else {
      newOptions[targetOptionIndex].votes++;
      newOptions[targetOptionIndex].voters.push(userId);
      newTotalVotes++;
    }

    // Create a new poll object to ensure React detects the change
    const updatedPoll: Poll = {
      ...poll,
      options: newOptions,
      totalVotes: newTotalVotes,
    };

    roomPolls[pollIndex] = updatedPoll;
    polls.set(roomId, roomPolls);

    return updatedPoll;
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

  // Save/update a poll received from another user (for sync)
  savePoll(roomId: string, poll: Poll): void {
    const roomPolls = pollService.getPolls(roomId);
    const existingIndex = roomPolls.findIndex(p => p.id === poll.id);

    if (existingIndex !== -1) {
      // Update existing poll
      roomPolls[existingIndex] = poll;
    } else {
      // Deactivate other polls if this one is active
      if (poll.isActive) {
        roomPolls.forEach(p => p.isActive = false);
      }
      roomPolls.push(poll);
    }

    polls.set(roomId, roomPolls);
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
