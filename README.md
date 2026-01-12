# Watch Party

[![Netlify Status](https://api.netlify.com/api/v1/badges/d1d4abdf-4e2a-42a7-8b2f-923e370bf0ee/deploy-status)](https://app.netlify.com/sites/optimistic-clarke-29f167/deploys)

[Watch Party](https://optimistic-clarke-29f167.netlify.app/)

A real-time collaborative video watching application that allows multiple users to watch YouTube videos together synchronously, with real-time chat functionality.

## Quick Start with Docker

The easiest way to run Watch Party is with Docker:

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/) installed
- [Docker Compose](https://docs.docker.com/compose/install/) installed

### Production Mode

```bash
# Clone the repository
git clone https://github.com/kevinreber/watch-party.git
cd watch-party

# Copy environment file and configure
cp .env.example .env
# Edit .env with your YouTube API key

# Build and start all services
docker-compose up --build

# Or run in detached mode
docker-compose up -d --build
```

Access the app:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **MongoDB**: localhost:27017

### Development Mode (with hot reloading)

```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up --build
```

### Useful Docker Commands

```bash
# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Stop and remove volumes (clears database)
docker-compose down -v

# Rebuild a specific service
docker-compose up --build server

# View running containers
docker-compose ps
```

---

## Manual Setup (without Docker)

### Clone directory:

```bash
cd [workspace folder]
git clone https://github.com/kevinreber/watch-party.git
```

### Front End

```bash
cd client
cp .env.example .env
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000) to view project in the browser.

### Back End

```bash
cd server
cp .env.example .env
npm install
nodemon server.js
```

Open [http://localhost:3001](http://localhost:3001) to view project in the browser.

---

## Environment Variables

### Server (`server/.env`)

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB connection string | Yes |
| `YOUTUBE_API_KEY` | YouTube Data API v3 key - [Get credentials](https://developers.google.com/youtube/v3/docs/) | Yes |
| `PORT` | Server port (default: 3001) | No |
| `NODE_ENV` | Environment (development/production) | No |
| `ALLOWED_ORIGINS` | Comma-separated list of allowed CORS origins | No |

### Client (`client/.env`)

| Variable | Description | Required |
|----------|-------------|----------|
| `REACT_APP_API_BASE_URL` | Backend API URL (default: http://localhost:3001) | No |

---

## Tech Stack

- **Frontend**: React, TypeScript, Material-UI, Socket.io-client
- **Backend**: Node.js, Express, Socket.io
- **Database**: MongoDB with Mongoose
- **Deployment**: Docker, Nginx

---

## ToDo

### Front End

- [x] When user inputs YouTube link, get video id
- [x] Sync player with video playback
- [x] Validate YT link before YT id
- [ ] Disable play bar if no video is loaded
- [x] Create list of queued videos
- [ ] Users can re-arrange queued videos
- [x] Chat interface

### YT Player

- [x] Basic YouTube iframe setup
- [x] Feat: Add volume controls
- [ ] Feat: Add keyboard arrow features to control video
- [ ] Disable player controls if no video is loaded
- [ ] If video is removed, next video in queue takes its place
- [ ] If last video is removed, need to remove script and show "No Videos Found"
- [x] YouTube API
- [ ] Hide ads if possible
- [ ] Enlarge video
- [ ] Video controls with "space bar"

### Websockets

- [x] Setup backend servers for video
- [x] Manage play state of video
- [x] Manage pause state of video
- [x] Manage time state of video
- [x] Setup backend servers for chat w/ Socket.io
- [x] Sync state with YouTube API
- [x] Setup Rooms
- [x] Setup Users
- [x] Setup action when User joins room
- [x] When new users log in, they need updated Video List
- [ ] When new users log in, they need current Playlist state

### DB

- [x] MongoDB integration with Mongoose
- [x] Message persistence
- [x] Video queue persistence

### Security

- [x] CORS configuration
- [x] Input validation
- [x] XSS sanitization

### Future Features

- [ ] Integrate with Google calendars so users can plan recurring "meetings"
- [ ] User authentication
- [ ] Private rooms

---

## Resources

### Similar Projects

- [watchparty](https://github.com/howardchung/watchparty/blob/master/server/room.ts) (Hackathon Project)
- [wevid-youtube-together](https://github.com/filahf/wevid-youtube-together/blob/master/server/server.js) (Reddit Post)
- [react-youtube-sync](https://github.com/bramgiessen/react-youtube-sync/tree/master/server)
- [YT-Together](https://github.com/YasserYka/YT-Together/blob/master/frontend/src/components/Watch.js)

### Instructions (How To)

- [Build React Video Streaming App](https://www.linode.com/docs/guides/build-react-video-streaming-app/)

### Chat Feature

- [emoji-mart](https://www.npmjs.com/package/emoji-mart) (Emojis)

### YT Player & React Player Packages

- [react-yt](https://github.com/BTMPL/react-yt)
- [react-player](https://cookpete.com/react-player/)
