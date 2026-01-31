import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ============================================
// SYSTEM TEMPLATES (pre-defined)
// ============================================

const SYSTEM_TEMPLATES = [
  {
    name: "Movie Night",
    description: "Perfect for watching movies with friends",
    icon: "🎬",
    isPrivate: false,
    maxCapacity: 20,
    theme: {
      backgroundColor: "#1a1a2e",
      accentColor: "#e94560",
      chatBackground: "#16213e",
    },
    videos: [],
  },
  {
    name: "Music Session",
    description: "Listen to music videos together",
    icon: "🎵",
    isPrivate: false,
    maxCapacity: 50,
    theme: {
      backgroundColor: "#0f0e17",
      accentColor: "#ff8906",
      chatBackground: "#232136",
    },
    videos: [],
  },
  {
    name: "Study Group",
    description: "Watch educational content together",
    icon: "📚",
    isPrivate: true,
    maxCapacity: 10,
    theme: {
      backgroundColor: "#fef6e4",
      accentColor: "#8bd3dd",
      chatBackground: "#f3d2c1",
    },
    videos: [],
  },
  {
    name: "Gaming Stream",
    description: "Watch gaming content with your squad",
    icon: "🎮",
    isPrivate: false,
    maxCapacity: 30,
    theme: {
      backgroundColor: "#0d1b2a",
      accentColor: "#00ff87",
      chatBackground: "#1b263b",
    },
    videos: [],
  },
  {
    name: "Anime Club",
    description: "For anime watching sessions",
    icon: "🍿",
    isPrivate: false,
    maxCapacity: 25,
    theme: {
      backgroundColor: "#1a1a2e",
      accentColor: "#ff6b9d",
      chatBackground: "#2d2d44",
    },
    videos: [],
  },
  {
    name: "Private Hangout",
    description: "A cozy space for close friends",
    icon: "🏠",
    isPrivate: true,
    maxCapacity: 5,
    theme: {
      backgroundColor: "#2d3436",
      accentColor: "#74b9ff",
      chatBackground: "#353b48",
    },
    videos: [],
  },
];

// ============================================
// TEMPLATE QUERIES
// ============================================

export const getSystemTemplates = query({
  args: {},
  handler: async (ctx) => {
    // Get templates from database
    const templates = await ctx.db
      .query("roomTemplates")
      .withIndex("by_system", (q) => q.eq("isSystem", true))
      .collect();

    if (templates.length > 0) {
      return templates.map((t) => ({
        ...t,
        createdAt: new Date(t.createdAt).toISOString(),
      }));
    }

    // Return hardcoded templates if none in DB
    return SYSTEM_TEMPLATES.map((t, index) => ({
      _id: `system-${index}` as any,
      ...t,
      isSystem: true,
      createdBy: null,
      usageCount: 0,
      createdAt: new Date().toISOString(),
    }));
  },
});

export const getMyTemplates = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) return [];

    const templates = await ctx.db
      .query("roomTemplates")
      .withIndex("by_creator", (q) => q.eq("createdBy", user._id))
      .collect();

    return templates.map((t) => ({
      ...t,
      createdAt: new Date(t.createdAt).toISOString(),
    }));
  },
});

export const getTemplate = query({
  args: { templateId: v.id("roomTemplates") },
  handler: async (ctx, args) => {
    const template = await ctx.db.get(args.templateId);
    if (!template) return null;

    return {
      ...template,
      createdAt: new Date(template.createdAt).toISOString(),
    };
  },
});

// ============================================
// TEMPLATE CRUD
// ============================================

export const createTemplate = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    isPrivate: v.boolean(),
    maxCapacity: v.number(),
    theme: v.object({
      backgroundColor: v.string(),
      accentColor: v.string(),
      chatBackground: v.string(),
    }),
    videos: v.array(
      v.object({
        videoId: v.string(),
        url: v.string(),
        name: v.string(),
        channel: v.optional(v.string()),
        img: v.optional(v.string()),
      })
    ),
    icon: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    const templateId = await ctx.db.insert("roomTemplates", {
      name: args.name,
      description: args.description,
      createdBy: user._id,
      isSystem: false,
      isPrivate: args.isPrivate,
      maxCapacity: args.maxCapacity,
      theme: args.theme,
      videos: args.videos,
      icon: args.icon,
      usageCount: 0,
      createdAt: Date.now(),
    });

    return templateId;
  },
});

export const updateTemplate = mutation({
  args: {
    templateId: v.id("roomTemplates"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    isPrivate: v.optional(v.boolean()),
    maxCapacity: v.optional(v.number()),
    theme: v.optional(
      v.object({
        backgroundColor: v.string(),
        accentColor: v.string(),
        chatBackground: v.string(),
      })
    ),
    videos: v.optional(
      v.array(
        v.object({
          videoId: v.string(),
          url: v.string(),
          name: v.string(),
          channel: v.optional(v.string()),
          img: v.optional(v.string()),
        })
      )
    ),
    icon: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    const template = await ctx.db.get(args.templateId);
    if (!template) throw new Error("Template not found");
    if (template.isSystem) throw new Error("Cannot edit system templates");
    if (template.createdBy !== user._id) throw new Error("Not authorized");

    const updates: Record<string, unknown> = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;
    if (args.isPrivate !== undefined) updates.isPrivate = args.isPrivate;
    if (args.maxCapacity !== undefined) updates.maxCapacity = args.maxCapacity;
    if (args.theme !== undefined) updates.theme = args.theme;
    if (args.videos !== undefined) updates.videos = args.videos;
    if (args.icon !== undefined) updates.icon = args.icon;

    await ctx.db.patch(args.templateId, updates);
    return { success: true };
  },
});

export const deleteTemplate = mutation({
  args: { templateId: v.id("roomTemplates") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    const template = await ctx.db.get(args.templateId);
    if (!template) throw new Error("Template not found");
    if (template.isSystem) throw new Error("Cannot delete system templates");
    if (template.createdBy !== user._id) throw new Error("Not authorized");

    await ctx.db.delete(args.templateId);
    return { success: true };
  },
});

// ============================================
// CREATE ROOM FROM TEMPLATE
// ============================================

export const createRoomFromTemplate = mutation({
  args: {
    templateId: v.optional(v.id("roomTemplates")),
    systemTemplateName: v.optional(v.string()),
    roomName: v.string(),
    password: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    let template;

    if (args.templateId) {
      template = await ctx.db.get(args.templateId);
      if (!template) throw new Error("Template not found");

      // Increment usage count
      await ctx.db.patch(args.templateId, { usageCount: template.usageCount + 1 });
    } else if (args.systemTemplateName) {
      // Find system template by name
      const systemTemplate = SYSTEM_TEMPLATES.find((t) => t.name === args.systemTemplateName);
      if (!systemTemplate) throw new Error("System template not found");
      template = systemTemplate;
    } else {
      throw new Error("Must provide templateId or systemTemplateName");
    }

    // Create room with template settings
    const roomId = await ctx.db.insert("rooms", {
      name: args.roomName,
      ownerId: user._id,
      isPrivate: template.isPrivate,
      password: args.password,
      maxCapacity: template.maxCapacity,
      isPersistent: false,
      theme: template.theme,
      currentVideo: template.videos.length > 0 ? template.videos[0] : undefined,
      videoQueue: template.videos.slice(1),
      isPlaying: false,
      currentTime: 0,
      lastSyncAt: Date.now(),
      createdAt: Date.now(),
    });

    // Add creator as member
    await ctx.db.insert("roomMembers", {
      roomId,
      userId: user._id,
      joinedAt: Date.now(),
      lastActiveAt: Date.now(),
      isTyping: false,
      role: "cohost",
    });

    // Update user stats
    await ctx.db.patch(user._id, {
      stats: {
        ...user.stats,
        partiesHosted: user.stats.partiesHosted + 1,
      },
    });

    // Log activity
    await ctx.db.insert("userActivity", {
      userId: user._id,
      type: "created_room",
      roomId,
      roomName: args.roomName,
      isActive: false,
      createdAt: Date.now(),
    });

    return roomId;
  },
});

// ============================================
// SAVE CURRENT ROOM AS TEMPLATE
// ============================================

export const saveRoomAsTemplate = mutation({
  args: {
    roomId: v.id("rooms"),
    name: v.string(),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("Room not found");
    if (room.ownerId !== user._id) throw new Error("Only room owner can save as template");

    // Collect current videos
    const videos = [];
    if (room.currentVideo) {
      videos.push(room.currentVideo);
    }
    videos.push(...room.videoQueue);

    const templateId = await ctx.db.insert("roomTemplates", {
      name: args.name,
      description: args.description,
      createdBy: user._id,
      isSystem: false,
      isPrivate: room.isPrivate,
      maxCapacity: room.maxCapacity,
      theme: room.theme,
      videos,
      icon: args.icon,
      usageCount: 0,
      createdAt: Date.now(),
    });

    return templateId;
  },
});

// ============================================
// INITIALIZE SYSTEM TEMPLATES
// ============================================

export const initializeSystemTemplates = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if system templates already exist
    const existing = await ctx.db
      .query("roomTemplates")
      .withIndex("by_system", (q) => q.eq("isSystem", true))
      .first();

    if (existing) return { message: "System templates already initialized" };

    // Create system templates
    for (const template of SYSTEM_TEMPLATES) {
      await ctx.db.insert("roomTemplates", {
        name: template.name,
        description: template.description,
        createdBy: undefined,
        isSystem: true,
        isPrivate: template.isPrivate,
        maxCapacity: template.maxCapacity,
        theme: template.theme,
        videos: template.videos,
        icon: template.icon,
        usageCount: 0,
        createdAt: Date.now(),
      });
    }

    return { message: "System templates initialized", count: SYSTEM_TEMPLATES.length };
  },
});
