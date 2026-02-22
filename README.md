# Watch Party

A real-time synchronized video watching application where users can watch YouTube videos together in shared rooms with chat, social features, and gamification.

## Features

- **Synchronized Video Playback** - Watch YouTube videos in sync with friends in real-time
- **Live Chat** - Chat with room members while watching, with emoji reactions
- **Rooms** - Create and join watch party rooms with video queues
- **Social** - Friends system, groups/communities, and activity feeds
- **Gamification** - Badges, watch streaks, and leaderboards
- **Playlists** - Save and manage video playlists
- **Moderation** - Room roles, bans, mutes, and member management
- **Scheduled Parties** - Plan watch parties in advance with invitations

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Material-UI 5 |
| Routing | React Router 7 (SSR enabled) |
| Backend | Convex (real-time database, functions, subscriptions) |
| Auth | Clerk (Google OAuth) |
| Build | Vite 5 |
| Server | Express (SSR) |
| Testing | Vitest (unit), Playwright (E2E) |

## Getting Started

### Prerequisites

- Node.js 20+
- A [Convex](https://convex.dev) account
- A [Clerk](https://clerk.com) account with Google OAuth configured

### Setup

```bash
git clone https://github.com/kevinreber/watch-party.git
cd watch-party
npm install
```

### Environment Variables

Create a `.env` file in the root directory:

```bash
# Required
VITE_CONVEX_URL=https://your-deployment.convex.cloud
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Optional
YOUTUBE_API_KEY=...       # Enables YouTube video search
```

### Development

```bash
npm run dev          # Start dev server (Express + Convex)
```

This runs the Express SSR server and Convex dev backend in parallel. Open [http://localhost:3000](http://localhost:3000) to view the app.

You can also run them separately:

```bash
npm run dev:convex   # Convex dev backend only
npm run dev:app      # Express server only
```

### Build & Production

```bash
npm run build        # Deploy Convex functions + build React Router app
npm run start        # Start production server
```

## Project Structure

```
watch-party/
├── app/                        # React application
│   ├── components/             # UI components
│   ├── context/                # React contexts (Auth, Theme, User)
│   ├── hooks/                  # Custom hooks (including Convex hooks)
│   ├── providers/              # Convex + Clerk providers
│   ├── routes/                 # File-based routes
│   ├── types/                  # TypeScript types
│   └── utils/                  # Helpers and constants
├── convex/                     # Backend (schema, queries, mutations)
├── e2e/                        # Playwright E2E tests
├── docs/                       # Documentation
└── public/                     # Static assets
```

## Testing

```bash
npm run test         # Run unit tests (Vitest)
npm run test:watch   # Watch mode
npm run test:e2e     # Run E2E tests (Playwright)
npm run test:e2e:ui  # Playwright UI mode
```

### Test Data Seeding

```bash
npm run test:seed    # Seed test users, rooms, and friend data
npm run test:clear   # Clear test data
```

## Other Commands

```bash
npm run typecheck    # Run React Router typegen + TypeScript check
```

## Deployment

- **Frontend**: Vercel with SSR
- **Backend**: Convex Cloud
- **Build command**: `convex deploy && npx convex codegen && react-router build`

## Contributing

See [FEATURE_BACKLOG.md](./FEATURE_BACKLOG.md) for features that have backend support ready and need UI work.

## License

This project is private.
