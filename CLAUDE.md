# CLAUDE.md

This document provides essential context for AI assistants working on the Watch Party codebase.

## Project Overview

Watch Party is a real-time synchronized video watching application that allows multiple users to watch YouTube videos together in shared rooms. It features chat, social features, gamification (badges, streaks, leaderboards), and engagement tracking.

## Tech Stack

### Frontend
- **React 18.3** with **React Router 7.1** (SSR enabled)
- **TypeScript 5.1** with strict mode
- **Material-UI (MUI) 5.16** for components
- **Emotion** for CSS-in-JS styling
- **Vite 5.4** as build tool

### Backend
- **Convex 1.17** - Real-time backend (database, functions, subscriptions)
- **Clerk 5.0** - Authentication (Google OAuth)
- **Express 4.21** - SSR server

### Legacy (being removed)
- **Ably** - Real-time messaging (migrating to Convex subscriptions)

## Directory Structure

```
watch-party/
├── app/                           # React application
│   ├── components/                # React components
│   ├── context/                   # React contexts (Auth, Theme, User, Convex)
│   ├── hooks/                     # Custom hooks
│   │   └── convex/                # Convex query/mutation hooks
│   ├── providers/                 # ConvexClientProvider, ClerkProvider
│   ├── routes/                    # Route files (home, room, profile, APIs)
│   ├── types/                     # TypeScript types
│   ├── utils/                     # Helpers and constants
│   ├── root.tsx                   # Root layout with providers
│   └── entry.*.tsx                # SSR entry points
├── convex/                        # Backend functions and schema
│   ├── schema.ts                  # Database schema (26 tables)
│   ├── users.ts                   # User management
│   ├── rooms.ts                   # Room management
│   ├── messages.ts                # Chat messaging
│   ├── videoSync.ts               # Video synchronization
│   ├── badges.ts                  # Achievement badges
│   ├── leaderboards.ts            # Rankings
│   ├── friends.ts                 # Friend system
│   ├── groups.ts                  # Communities
│   ├── playlists.ts               # Playlist management
│   ├── moderation.ts              # Bans, mutes, roles
│   ├── activity.ts                # Activity feed
│   ├── streaks.ts                 # Watch streaks
│   ├── testing.ts                 # Test data seeding
│   └── auth.config.ts             # Clerk auth config
├── e2e/                           # Playwright E2E tests
├── docs/                          # Documentation
│   └── CONVEX_MIGRATION_PLAN.md   # Migration docs
├── FEATURE_BACKLOG.md             # Pending UI work
└── public/                        # Static assets
```

## Common Commands

```bash
# Development
npm run dev              # Start dev server (Express + Convex)
npm run dev:convex       # Start Convex dev backend only
npm run dev:app          # Start Express server only

# Build & Deploy
npm run build            # Convex deploy + React Router build
npm run start            # Production server

# Type Checking
npm run typecheck        # Run React Router typegen + tsc

# Testing
npm run test             # Run Vitest unit tests
npm run test:watch       # Watch mode
npm run test:e2e         # Run Playwright E2E tests
npm run test:e2e:ui      # Playwright UI mode

# Test Data
npm run test:seed        # Seed test users, rooms, friends
npm run test:clear       # Clear test data
```

## Code Conventions

### File Organization
- Components in `app/components/` with their own directories
- Each component has `.tsx` file and optional `.css`
- Path alias: `~/*` maps to `./app/*`

### TypeScript
- Strict mode enabled
- Use generated Convex types from `convex/_generated`
- Prefer type imports: `import type { ... }`

### Styling
- **Prettier**: 120 char width, single quotes, trailing commas
- **ESLint**: Airbnb preset with TypeScript
- Arrow functions required (`func-style: ["error", "expression"]`)
- Blank line before return statements

### React Patterns
- Functional components only
- Custom hooks in `app/hooks/`
- Context API for global state (Auth, Theme, User)
- Convex hooks for remote state (`useQuery`, `useMutation`)

### Convex Conventions
- Queries for read-only operations
- Mutations for write operations with auth checks
- Get current user: `ctx.auth.getUserIdentity()`
- Throw errors as strings
- Index naming: `by_field` or `by_field1_and_field2`

## Key Files

| File | Purpose |
|------|---------|
| `convex/schema.ts` | Database schema definition |
| `app/root.tsx` | App root with all providers |
| `app/providers/ConvexClientProvider.tsx` | Convex + Clerk setup |
| `app/context/AuthContext.tsx` | Authentication context |
| `app/routes/room.$roomId.tsx` | Main room view |
| `app/components/VideoPlayer/` | Video player with sync |
| `app/components/ChatList/` | Room chat |

## Database Schema Overview

The Convex schema has 26 tables organized by domain:

**Users & Auth**: `users`, `badges`

**Rooms & Video**: `rooms`, `roomMembers`

**Chat**: `messages`, `reactions`

**Polls**: `polls`, `pollVotes`

**Social**: `friends`, `friendRequests`, `groups`, `groupMembers`, `groupInvites`

**Content**: `watchHistory`, `roomHistory`, `favoriteVideos`, `roomBookmarks`, `playlists`, `playlistVideos`

**Gamification**: `watchStreaks`, `dailyWatchLog`, `leaderboardEntries`

**Features**: `scheduledParties`, `partyInvitations`, `notifications`, `videoTimestamps`, `roomTemplates`

**Moderation**: `roomBans`, `roomMutes`

**Activity**: `userActivity`

## Environment Variables

```bash
# Required
VITE_CONVEX_URL=https://your-deployment.convex.cloud
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Optional
YOUTUBE_API_KEY=...
ABLY_API_KEY=...  # Legacy, can be removed
```

## Testing

### Unit Tests (Vitest)
- Located alongside source files as `*.test.ts`
- Run with `npm run test`

### E2E Tests (Playwright)
- Located in `e2e/` directory
- Uses Chromium
- Global setup seeds test data via Convex
- Run with `npm run test:e2e`

### Test Data Seeding
```bash
npx convex run testing:seedTestUsers
npx convex run testing:seedTestRooms
npx convex run testing:seedTestFriendData
npx convex run testing:clearTestData
```

## Current State

### Migration Status
The project has migrated from localStorage + Ably + in-memory storage to Convex:
- **Complete**: Schema, auth, rooms, messages, video sync, social features backend
- **Pending**: Some UI integration for badges, leaderboards, streaks (see FEATURE_BACKLOG.md)

### Feature Backlog
Key UI work needed (backend ready):
1. Badge display and unlock notifications
2. Leaderboards page verification
3. Profile page enhancements
4. Video reactions overlay
5. Room role indicators

See `FEATURE_BACKLOG.md` for complete list.

## Common Tasks

### Adding a New Convex Function
1. Add to appropriate file in `convex/` (e.g., `rooms.ts`)
2. Use `query` for reads, `mutation` for writes
3. Add auth check: `const identity = await ctx.auth.getUserIdentity()`
4. Import in component: `import { api } from 'convex/_generated/api'`
5. Use: `useQuery(api.rooms.getRoom, { roomId })` or `useMutation(api.rooms.createRoom)`

### Adding a New Route
1. Create file in `app/routes/` (e.g., `feature.tsx`)
2. Export default component and optional `loader`/`action`
3. Route auto-registered by file name

### Adding a New Component
1. Create directory in `app/components/ComponentName/`
2. Add `ComponentName.tsx` and optional `ComponentName.css`
3. Use MUI components for consistency
4. Import with alias: `import { ComponentName } from '~/components/ComponentName'`

### Working with Video Sync
- Video state stored in `rooms` table: `currentVideo`, `isPlaying`, `currentTime`
- Use `convex/videoSync.ts` functions
- `syncVideoState` for play/pause/seek
- `updateVideoQueue` for queue management

### Authentication Flow
1. Clerk handles OAuth (Google)
2. On login, `syncUser` mutation creates/updates Convex user
3. Access user via `useAuth()` hook from `AuthContext`
4. Convex functions get identity via `ctx.auth.getUserIdentity()`

## Deployment

- **Hosting**: Vercel (frontend) + Convex Cloud (backend)
- **Build**: `convex deploy --cmd 'react-router build'`
- **SSR**: Enabled with isbot detection for crawlers

## Troubleshooting

### Convex Types Not Updating
Run `npx convex dev` to regenerate types in `convex/_generated/`

### Authentication Issues
- Ensure Clerk keys are set in environment
- Check `convex/auth.config.ts` for Clerk domain

### Video Sync Drift
- Check `lastSyncAt` timestamp in room
- Verify all clients receiving subscription updates

## Resources

- [Convex Docs](https://docs.convex.dev/)
- [Clerk Docs](https://clerk.com/docs)
- [React Router 7 Docs](https://reactrouter.com/)
- [MUI Docs](https://mui.com/)
