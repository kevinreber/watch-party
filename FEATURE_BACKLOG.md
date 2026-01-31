# Feature Backlog

This document tracks features that have backend support but need UI integration or additional work.

## High Priority

### Badge System UI
- **Status**: Backend complete, UI missing
- **Backend**: `convex/badges.ts` - 25+ badge definitions, checkAndAwardBadges, progress tracking
- **Needed**:
  - [ ] Badge display component for user profiles
  - [ ] Badge unlock notification/toast when earned
  - [ ] Badge progress indicators
  - [ ] Badge showcase selector for profiles

### Leaderboards Page
- **Status**: Backend complete, route exists but needs verification
- **Backend**: `convex/leaderboards.ts` - rankings for watchTime, partiesHosted, messagesSent, reactionsGiven
- **Route**: `app/routes/leaderboards.tsx`
- **Needed**:
  - [ ] Verify leaderboards page renders correctly
  - [ ] Add category/period filter UI
  - [ ] Add user rank highlighting
  - [ ] Link from StreakDisplay to leaderboards

### Profile Page
- **Status**: Backend complete, route exists but needs verification
- **Backend**: `convex/users.ts` - getUserByUsername, getUserProfile
- **Route**: `app/routes/profile.tsx`
- **Needed**:
  - [ ] Verify profile page renders correctly
  - [ ] Add badge showcase section
  - [ ] Add activity feed on profile
  - [ ] Add friend/follow button

## Medium Priority

### Video Reactions Overlay
- **Status**: Not started
- **Description**: Show emoji reactions floating over the video player when users react
- **Needed**:
  - [ ] Reaction overlay component
  - [ ] Animation system for floating emojis
  - [ ] Integration with existing EmojiReactions component

### Room Member Roles UI Enhancement
- **Status**: Backend complete, basic UI exists
- **Backend**: `convex/moderation.ts` - role management
- **Needed**:
  - [ ] Visual role indicators (badges/icons) next to usernames in chat
  - [ ] Role-based styling in member list
  - [ ] Cohost/moderator permissions explanation tooltip

### Group Features Enhancement
- **Status**: Backend complete, basic UI exists
- **Backend**: `convex/groups.ts`
- **Needed**:
  - [ ] Group chat/messaging
  - [ ] Group watch party scheduling
  - [ ] Group activity feed
  - [ ] Group admin panel for managing members
  - [ ] Group invite link generation

### Playlist Enhancement
- **Status**: Backend complete, basic UI exists
- **Backend**: `convex/playlists.ts`
- **Needed**:
  - [ ] Drag-and-drop reordering
  - [ ] Playlist sharing between users
  - [ ] Collaborative playlists
  - [ ] Import from YouTube playlists

## Low Priority / Future Features

### Voice Chat
- **Status**: Not started
- **Description**: Optional voice channels for rooms
- **Needed**:
  - [ ] WebRTC integration or third-party service
  - [ ] Voice channel UI
  - [ ] Mute/deafen controls
  - [ ] Push-to-talk option

### Screen Sharing
- **Status**: Not started
- **Description**: Allow hosts to share their screen instead of YouTube videos
- **Needed**:
  - [ ] WebRTC screen capture
  - [ ] Screen share viewer component
  - [ ] Permission controls

### Custom Emote Packs
- **Status**: Not started
- **Description**: User-uploaded or premium emote packs
- **Needed**:
  - [ ] Emote upload system
  - [ ] Emote pack management
  - [ ] Emote picker enhancement

### Watch Party Themes
- **Status**: Partial - theme settings exist
- **Needed**:
  - [ ] Pre-built theme presets
  - [ ] Theme marketplace/sharing
  - [ ] Seasonal/event themes

### Achievement Notifications
- **Status**: Backend has badge system, no notification UI
- **Needed**:
  - [ ] Toast/notification component for achievements
  - [ ] Achievement unlock animation
  - [ ] Sound effects (optional)

### Activity Feed Enhancements
- **Status**: Basic implementation exists
- **Needed**:
  - [ ] Real-time updates via subscription
  - [ ] Activity filtering options
  - [ ] "Join friend's room" quick action
  - [ ] Activity notifications

## Technical Debt

### Code Quality
- [ ] Add TypeScript strict mode compliance
- [ ] Add unit tests for new components
- [ ] Add integration tests for Convex functions
- [ ] Component documentation

### Performance
- [ ] Optimize query subscriptions
- [ ] Add pagination to activity feeds
- [ ] Lazy load modals/panels
- [ ] Image optimization for avatars

### Accessibility
- [ ] Keyboard navigation for all modals
- [ ] Screen reader support
- [ ] Focus management
- [ ] Color contrast verification

---

## Implementation Notes

### Existing Backend APIs Ready for UI

| Feature | Convex File | Key Functions |
|---------|-------------|---------------|
| Badges | `badges.ts` | `checkAndAwardBadges`, `getMyBadges`, `getBadgeProgress` |
| Leaderboards | `leaderboards.ts` | `getLeaderboard`, `getMyRank` |
| Streaks | `streaks.ts` | `getMyStreak`, `recordWatchSession` |
| Moderation | `moderation.ts` | `kickMember`, `banUser`, `muteUser`, `setMemberRole` |
| Groups | `groups.ts` | Full CRUD, invites, membership |
| Playlists | `playlists.ts` | Full CRUD, video management |
| Templates | `templates.ts` | System + user templates, room creation |
| Activity | `activity.ts` | `logActivity`, `getFriendsActivity`, `getActiveWatchers` |

### New Routes Added
- `/profile/:username` - User profile page
- `/leaderboards` - Global rankings
