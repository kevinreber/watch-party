// Room Service - For enhanced room features
import type { Room, RoomTheme } from "~/types";
import { storage } from "~/utils/storage";
import { mockAuth } from "./mockAuth";

// Generate a unique ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// In-memory room storage (simulating server-side state)
let rooms: Map<string, Room> = new Map();

// Default room theme
const defaultTheme: RoomTheme = {
  backgroundColor: "#0f0f0f",
  accentColor: "#6366f1",
  chatBackground: "#1a1a1a",
};

// Storage key for persistent rooms
const PERSISTENT_ROOMS_KEY = "watchparty_persistent_rooms";

// Load persistent rooms from storage
function loadPersistentRooms(): void {
  const saved = storage.get<Room[]>(PERSISTENT_ROOMS_KEY, []);
  saved.forEach(room => {
    if (room.isPersistent) {
      rooms.set(room.id, room);
    }
  });
}

// Save persistent rooms to storage
function savePersistentRooms(): void {
  const persistentRooms = Array.from(rooms.values()).filter(r => r.isPersistent);
  storage.set(PERSISTENT_ROOMS_KEY, persistentRooms);
}

// Initialize on load
if (typeof window !== "undefined") {
  loadPersistentRooms();
}

export const roomService = {
  // Get room by ID
  getRoom(roomId: string): Room | null {
    return rooms.get(roomId) || null;
  },

  // Create a new room
  createRoom(
    name: string,
    options: {
      isPrivate?: boolean;
      password?: string;
      maxCapacity?: number;
      theme?: RoomTheme;
      isPersistent?: boolean;
    } = {}
  ): Room {
    const currentUser = mockAuth.getCurrentUser();
    const roomId = name.toLowerCase().replace(/\s+/g, "-");

    const room: Room = {
      id: roomId,
      name,
      ownerId: currentUser?.id || "anonymous",
      ownerName: currentUser?.username || "Anonymous",
      isPrivate: options.isPrivate || false,
      password: options.password,
      maxCapacity: options.maxCapacity || 50,
      currentUsers: 1,
      createdAt: new Date().toISOString(),
      theme: options.theme || defaultTheme,
      isPersistent: options.isPersistent || false,
    };

    rooms.set(roomId, room);

    if (room.isPersistent) {
      savePersistentRooms();
    }

    return room;
  },

  // Join a room
  joinRoom(roomId: string, password?: string): { success: boolean; error?: string; room?: Room } {
    let room = rooms.get(roomId);

    // If room doesn't exist, create it (non-persistent)
    if (!room) {
      room = {
        id: roomId,
        name: roomId,
        ownerId: "system",
        ownerName: "System",
        isPrivate: false,
        maxCapacity: 50,
        currentUsers: 0,
        createdAt: new Date().toISOString(),
        theme: defaultTheme,
        isPersistent: false,
      };
      rooms.set(roomId, room);
    }

    // Check password for private rooms
    if (room.isPrivate && room.password) {
      if (password !== room.password) {
        return { success: false, error: "Incorrect password" };
      }
    }

    // Check capacity
    if (room.currentUsers >= room.maxCapacity) {
      return { success: false, error: "Room is full" };
    }

    // Increment user count
    room.currentUsers++;
    rooms.set(roomId, room);

    return { success: true, room };
  },

  // Leave a room
  leaveRoom(roomId: string): void {
    const room = rooms.get(roomId);
    if (room) {
      room.currentUsers = Math.max(0, room.currentUsers - 1);

      // Delete non-persistent empty rooms
      if (room.currentUsers === 0 && !room.isPersistent) {
        rooms.delete(roomId);
      } else {
        rooms.set(roomId, room);
      }
    }
  },

  // Update room settings (owner only)
  updateRoom(roomId: string, updates: Partial<Room>): Room | null {
    const room = rooms.get(roomId);
    if (!room) return null;

    const currentUser = mockAuth.getCurrentUser();
    if (room.ownerId !== currentUser?.id && room.ownerId !== "system") {
      return null; // Not authorized
    }

    const updatedRoom = { ...room, ...updates, id: roomId }; // Prevent ID change
    rooms.set(roomId, updatedRoom);

    if (updatedRoom.isPersistent) {
      savePersistentRooms();
    }

    return updatedRoom;
  },

  // Set room privacy
  setRoomPrivacy(roomId: string, isPrivate: boolean, password?: string): Room | null {
    return roomService.updateRoom(roomId, { isPrivate, password });
  },

  // Set room capacity
  setRoomCapacity(roomId: string, maxCapacity: number): Room | null {
    return roomService.updateRoom(roomId, { maxCapacity });
  },

  // Update room theme
  updateRoomTheme(roomId: string, theme: Partial<RoomTheme>): Room | null {
    const room = rooms.get(roomId);
    if (!room) return null;

    return roomService.updateRoom(roomId, {
      theme: { ...room.theme, ...theme } as RoomTheme,
    });
  },

  // Transfer room ownership
  transferOwnership(roomId: string, newOwnerId: string, newOwnerName: string): Room | null {
    const room = rooms.get(roomId);
    if (!room) return null;

    const currentUser = mockAuth.getCurrentUser();
    if (room.ownerId !== currentUser?.id) {
      return null; // Not authorized
    }

    return roomService.updateRoom(roomId, {
      ownerId: newOwnerId,
      ownerName: newOwnerName,
    });
  },

  // Check if user is room owner
  isRoomOwner(roomId: string): boolean {
    const room = rooms.get(roomId);
    const currentUser = mockAuth.getCurrentUser();
    return room?.ownerId === currentUser?.id;
  },

  // Make room persistent
  makeRoomPersistent(roomId: string): Room | null {
    const updated = roomService.updateRoom(roomId, { isPersistent: true });
    if (updated) {
      savePersistentRooms();
    }
    return updated;
  },

  // Get all persistent rooms
  getPersistentRooms(): Room[] {
    return Array.from(rooms.values()).filter(r => r.isPersistent);
  },

  // Delete a room (owner only)
  deleteRoom(roomId: string): boolean {
    const room = rooms.get(roomId);
    if (!room) return false;

    const currentUser = mockAuth.getCurrentUser();
    if (room.ownerId !== currentUser?.id) {
      return false; // Not authorized
    }

    rooms.delete(roomId);
    savePersistentRooms();
    return true;
  },

  // Validate room password
  validatePassword(roomId: string, password: string): boolean {
    const room = rooms.get(roomId);
    if (!room || !room.isPrivate) return true;
    return room.password === password;
  },

  // Get room user count
  getRoomUserCount(roomId: string): number {
    return rooms.get(roomId)?.currentUsers || 0;
  },
};
