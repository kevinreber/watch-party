import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ============================================
// ONBOARDING CONSTANTS
// ============================================

export const ONBOARDING_STEPS = [
  {
    id: "profileSetup",
    title: "Set Up Your Profile",
    description: "Add an avatar and customize your profile",
    xpReward: 50,
  },
  {
    id: "firstRoom",
    title: "Join Your First Room",
    description: "Join or create a watch party room",
    xpReward: 50,
  },
  {
    id: "firstVideo",
    title: "Watch Your First Video",
    description: "Start watching a video with others",
    xpReward: 50,
  },
  {
    id: "firstMessage",
    title: "Say Hello",
    description: "Send your first chat message",
    xpReward: 25,
  },
  {
    id: "firstFriend",
    title: "Make a Friend",
    description: "Add your first friend",
    xpReward: 75,
  },
  {
    id: "firstPlaylist",
    title: "Create a Playlist",
    description: "Create your first playlist",
    xpReward: 50,
  },
];

export const ONBOARDING_COMPLETION_BADGE = {
  name: "Getting Started",
  description: "Completed the onboarding tutorial",
  icon: "🎓",
  category: "special" as const,
};

export const ONBOARDING_COMPLETION_XP = 100;

// ============================================
// ONBOARDING QUERIES
// ============================================

export const getOnboardingStatus = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) return null;

    const onboarding = await ctx.db
      .query("userOnboarding")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (!onboarding) {
      return {
        isStarted: false,
        isComplete: false,
        currentStep: 0,
        steps: ONBOARDING_STEPS.map((step) => ({
          ...step,
          completed: false,
        })),
        totalXpAvailable: ONBOARDING_STEPS.reduce((sum, s) => sum + s.xpReward, 0) + ONBOARDING_COMPLETION_XP,
      };
    }

    const stepsWithStatus = ONBOARDING_STEPS.map((step) => ({
      ...step,
      completed: onboarding.steps[step.id as keyof typeof onboarding.steps] || false,
    }));

    const completedCount = stepsWithStatus.filter((s) => s.completed).length;
    const isComplete = completedCount === ONBOARDING_STEPS.length;

    return {
      isStarted: true,
      isComplete,
      currentStep: onboarding.currentStep,
      steps: stepsWithStatus,
      completedCount,
      totalSteps: ONBOARDING_STEPS.length,
      onboardingBadgeClaimed: onboarding.onboardingBadgeClaimed,
      onboardingXpClaimed: onboarding.onboardingXpClaimed,
      startedAt: onboarding.startedAt,
      completedAt: onboarding.completedAt,
      totalXpAvailable: ONBOARDING_STEPS.reduce((sum, s) => sum + s.xpReward, 0) + ONBOARDING_COMPLETION_XP,
    };
  },
});

export const getOnboardingSteps = query({
  args: {},
  handler: async () => {
    return ONBOARDING_STEPS;
  },
});

// ============================================
// ONBOARDING MUTATIONS
// ============================================

export const startOnboarding = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    // Check if already started
    const existing = await ctx.db
      .query("userOnboarding")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (existing) {
      return { success: true, message: "Onboarding already started" };
    }

    await ctx.db.insert("userOnboarding", {
      userId: user._id,
      steps: {
        profileSetup: false,
        firstRoom: false,
        firstVideo: false,
        firstMessage: false,
        firstFriend: false,
        firstPlaylist: false,
        tutorialComplete: false,
      },
      currentStep: 0,
      onboardingBadgeClaimed: false,
      onboardingXpClaimed: false,
      startedAt: Date.now(),
    });

    return { success: true };
  },
});

export const completeOnboardingStep = mutation({
  args: {
    stepId: v.union(
      v.literal("profileSetup"),
      v.literal("firstRoom"),
      v.literal("firstVideo"),
      v.literal("firstMessage"),
      v.literal("firstFriend"),
      v.literal("firstPlaylist")
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    let onboarding = await ctx.db
      .query("userOnboarding")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    // Auto-start onboarding if not started
    if (!onboarding) {
      const id = await ctx.db.insert("userOnboarding", {
        userId: user._id,
        steps: {
          profileSetup: false,
          firstRoom: false,
          firstVideo: false,
          firstMessage: false,
          firstFriend: false,
          firstPlaylist: false,
          tutorialComplete: false,
        },
        currentStep: 0,
        onboardingBadgeClaimed: false,
        onboardingXpClaimed: false,
        startedAt: Date.now(),
      });
      onboarding = await ctx.db.get(id);
    }

    if (!onboarding) throw new Error("Failed to create onboarding record");

    // Check if step already completed
    if (onboarding.steps[args.stepId]) {
      return { success: true, alreadyCompleted: true };
    }

    // Mark step as completed
    const newSteps = { ...onboarding.steps, [args.stepId]: true };

    // Find next incomplete step
    const stepIds = ONBOARDING_STEPS.map((s) => s.id);
    let nextStep = onboarding.currentStep;
    for (let i = 0; i < stepIds.length; i++) {
      if (!newSteps[stepIds[i] as keyof typeof newSteps]) {
        nextStep = i;
        break;
      }
      nextStep = i + 1;
    }

    // Check if all steps completed
    const allCompleted = ONBOARDING_STEPS.every(
      (s) => newSteps[s.id as keyof typeof newSteps]
    );

    await ctx.db.patch(onboarding._id, {
      steps: newSteps,
      currentStep: nextStep,
      completedAt: allCompleted ? Date.now() : undefined,
    });

    // Get XP reward for this step
    const step = ONBOARDING_STEPS.find((s) => s.id === args.stepId);
    const xpReward = step?.xpReward || 0;

    return {
      success: true,
      stepCompleted: args.stepId,
      xpReward,
      allCompleted,
      nextStep,
    };
  },
});

export const claimOnboardingRewards = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    const onboarding = await ctx.db
      .query("userOnboarding")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (!onboarding) {
      throw new Error("Onboarding not started");
    }

    // Check if all steps completed
    const allCompleted = ONBOARDING_STEPS.every(
      (s) => onboarding.steps[s.id as keyof typeof onboarding.steps]
    );

    if (!allCompleted) {
      throw new Error("Onboarding not complete");
    }

    const rewards: { type: string; value: any }[] = [];

    // Award badge if not claimed
    if (!onboarding.onboardingBadgeClaimed) {
      await ctx.db.insert("badges", {
        userId: user._id,
        name: ONBOARDING_COMPLETION_BADGE.name,
        description: ONBOARDING_COMPLETION_BADGE.description,
        icon: ONBOARDING_COMPLETION_BADGE.icon,
        category: ONBOARDING_COMPLETION_BADGE.category,
        earnedAt: Date.now(),
      });

      rewards.push({ type: "badge", value: ONBOARDING_COMPLETION_BADGE });

      // Log activity
      await ctx.db.insert("userActivity", {
        userId: user._id,
        type: "earned_badge",
        badgeName: ONBOARDING_COMPLETION_BADGE.name,
        isActive: false,
        createdAt: Date.now(),
      });

      // Send notification
      await ctx.db.insert("notifications", {
        userId: user._id,
        type: "badge_earned",
        title: "Badge Earned! 🎓",
        message: `You earned the "${ONBOARDING_COMPLETION_BADGE.name}" badge for completing the tutorial!`,
        read: false,
        data: { badgeName: ONBOARDING_COMPLETION_BADGE.name },
        createdAt: Date.now(),
      });
    }

    // Mark rewards as claimed
    await ctx.db.patch(onboarding._id, {
      onboardingBadgeClaimed: true,
      onboardingXpClaimed: true,
      steps: { ...onboarding.steps, tutorialComplete: true },
    });

    // Return XP amount for the levels system to award
    if (!onboarding.onboardingXpClaimed) {
      rewards.push({ type: "xp", value: ONBOARDING_COMPLETION_XP });
    }

    return {
      success: true,
      rewards,
      totalXp: ONBOARDING_COMPLETION_XP,
    };
  },
});

export const skipOnboarding = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    let onboarding = await ctx.db
      .query("userOnboarding")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (!onboarding) {
      await ctx.db.insert("userOnboarding", {
        userId: user._id,
        steps: {
          profileSetup: false,
          firstRoom: false,
          firstVideo: false,
          firstMessage: false,
          firstFriend: false,
          firstPlaylist: false,
          tutorialComplete: true, // Mark as complete to hide tutorial
        },
        currentStep: ONBOARDING_STEPS.length,
        onboardingBadgeClaimed: false,
        onboardingXpClaimed: false,
        startedAt: Date.now(),
        completedAt: Date.now(),
      });
    } else {
      await ctx.db.patch(onboarding._id, {
        steps: { ...onboarding.steps, tutorialComplete: true },
        currentStep: ONBOARDING_STEPS.length,
        completedAt: Date.now(),
      });
    }

    return { success: true };
  },
});
