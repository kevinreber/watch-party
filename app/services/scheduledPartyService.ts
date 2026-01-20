// Scheduled Watch Party Service
import type { ScheduledParty, Video } from "~/types";
import { storage, STORAGE_KEYS } from "~/utils/storage";
import { mockAuth } from "./mockAuth";

// Generate a unique ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Generate room ID from party name
function generateRoomId(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-") + "-" + generateId().slice(0, 6);
}

export const scheduledPartyService = {
  // Get all scheduled parties
  getScheduledParties(): ScheduledParty[] {
    return storage.get<ScheduledParty[]>(STORAGE_KEYS.SCHEDULED_PARTIES, []);
  },

  // Get upcoming parties (not yet started)
  getUpcomingParties(): ScheduledParty[] {
    const now = new Date().getTime();
    return scheduledPartyService.getScheduledParties()
      .filter(p => new Date(p.scheduledFor).getTime() > now)
      .sort((a, b) =>
        new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime()
      );
  },

  // Get parties created by current user
  getMyParties(): ScheduledParty[] {
    const currentUser = mockAuth.getCurrentUser();
    if (!currentUser) return [];

    return scheduledPartyService.getScheduledParties()
      .filter(p => p.createdBy === currentUser.id);
  },

  // Get parties user is invited to
  getInvitedParties(): ScheduledParty[] {
    const currentUser = mockAuth.getCurrentUser();
    if (!currentUser) return [];

    return scheduledPartyService.getScheduledParties()
      .filter(p => p.invitedUsers.includes(currentUser.id));
  },

  // Create a scheduled party
  createScheduledParty(
    name: string,
    scheduledFor: string,
    description?: string,
    videos: Video[] = [],
    invitedUsers: string[] = [],
    isRecurring: boolean = false,
    recurrencePattern?: ScheduledParty["recurrencePattern"]
  ): ScheduledParty {
    const currentUser = mockAuth.getCurrentUser();
    if (!currentUser) {
      throw new Error("Must be logged in to create a scheduled party");
    }

    const parties = scheduledPartyService.getScheduledParties();
    const newParty: ScheduledParty = {
      id: generateId(),
      name,
      description,
      scheduledFor,
      createdBy: currentUser.id,
      creatorName: currentUser.username,
      roomId: generateRoomId(name),
      invitedUsers,
      acceptedUsers: [currentUser.id],
      videos,
      isRecurring,
      recurrencePattern,
    };

    parties.push(newParty);
    storage.set(STORAGE_KEYS.SCHEDULED_PARTIES, parties);
    return newParty;
  },

  // Update a scheduled party
  updateScheduledParty(partyId: string, updates: Partial<ScheduledParty>): ScheduledParty | null {
    const parties = scheduledPartyService.getScheduledParties();
    const partyIndex = parties.findIndex(p => p.id === partyId);

    if (partyIndex === -1) return null;

    const updatedParty = { ...parties[partyIndex], ...updates };
    parties[partyIndex] = updatedParty;
    storage.set(STORAGE_KEYS.SCHEDULED_PARTIES, parties);
    return updatedParty;
  },

  // Delete a scheduled party
  deleteScheduledParty(partyId: string): void {
    const parties = scheduledPartyService.getScheduledParties();
    const filtered = parties.filter(p => p.id !== partyId);
    storage.set(STORAGE_KEYS.SCHEDULED_PARTIES, filtered);
  },

  // Accept party invitation
  acceptInvitation(partyId: string): void {
    const currentUser = mockAuth.getCurrentUser();
    if (!currentUser) return;

    const parties = scheduledPartyService.getScheduledParties();
    const partyIndex = parties.findIndex(p => p.id === partyId);

    if (partyIndex !== -1 && !parties[partyIndex].acceptedUsers.includes(currentUser.id)) {
      parties[partyIndex].acceptedUsers.push(currentUser.id);
      storage.set(STORAGE_KEYS.SCHEDULED_PARTIES, parties);
    }
  },

  // Decline party invitation
  declineInvitation(partyId: string): void {
    const currentUser = mockAuth.getCurrentUser();
    if (!currentUser) return;

    const parties = scheduledPartyService.getScheduledParties();
    const partyIndex = parties.findIndex(p => p.id === partyId);

    if (partyIndex !== -1) {
      parties[partyIndex].invitedUsers = parties[partyIndex].invitedUsers
        .filter(id => id !== currentUser.id);
      parties[partyIndex].acceptedUsers = parties[partyIndex].acceptedUsers
        .filter(id => id !== currentUser.id);
      storage.set(STORAGE_KEYS.SCHEDULED_PARTIES, parties);
    }
  },

  // Invite users to party
  inviteUsers(partyId: string, userIds: string[]): void {
    const parties = scheduledPartyService.getScheduledParties();
    const partyIndex = parties.findIndex(p => p.id === partyId);

    if (partyIndex !== -1) {
      const party = parties[partyIndex];
      userIds.forEach(userId => {
        if (!party.invitedUsers.includes(userId)) {
          party.invitedUsers.push(userId);
        }
      });
      storage.set(STORAGE_KEYS.SCHEDULED_PARTIES, parties);
    }
  },

  // Add video to party queue
  addVideoToParty(partyId: string, video: Video): void {
    const parties = scheduledPartyService.getScheduledParties();
    const partyIndex = parties.findIndex(p => p.id === partyId);

    if (partyIndex !== -1) {
      parties[partyIndex].videos.push(video);
      storage.set(STORAGE_KEYS.SCHEDULED_PARTIES, parties);
    }
  },

  // Remove video from party queue
  removeVideoFromParty(partyId: string, videoId: string): void {
    const parties = scheduledPartyService.getScheduledParties();
    const partyIndex = parties.findIndex(p => p.id === partyId);

    if (partyIndex !== -1) {
      parties[partyIndex].videos = parties[partyIndex].videos
        .filter(v => v.videoId !== videoId);
      storage.set(STORAGE_KEYS.SCHEDULED_PARTIES, parties);
    }
  },

  // Get party by ID
  getPartyById(partyId: string): ScheduledParty | undefined {
    return scheduledPartyService.getScheduledParties()
      .find(p => p.id === partyId);
  },

  // Check if party is starting soon (within 15 minutes)
  isPartySoon(party: ScheduledParty): boolean {
    const now = new Date().getTime();
    const partyTime = new Date(party.scheduledFor).getTime();
    const fifteenMinutes = 15 * 60 * 1000;
    return partyTime - now <= fifteenMinutes && partyTime > now;
  },
};
