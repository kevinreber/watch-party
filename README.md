# Watch Party

[![Netlify Status](https://api.netlify.com/api/v1/badges/d1d4abdf-4e2a-42a7-8b2f-923e370bf0ee/deploy-status)](https://app.netlify.com/sites/optimistic-clarke-29f167/deploys)

[Watch Party](https://optimistic-clarke-29f167.netlify.app/)

## ToDo

### Front End

- [x] When user inputs YouTube link, get video id
- [x] Sync player with video playback
- [x] Validate YT link before YT id
- [ ] Disable play bar if no video is loaded
- [ ] Create list of queued videos
- [ ] Users can re-arrange queued videos
- [ ] Chat interface

### YT Player

- [x] Basic YouTube iframe setup
- [x] Feat: Add volume controls
- [ ] Feat: Add keyboard arrow features to control video
- [ ] Disable player controls if no video is loaded
- [ ] ? If video is removed, next video in queue takes it's place
- [ ] If last video is removed, need to remove script and show "No Videos Found"
- [ ] YouTube API
- [ ] hide ads if possible
- [ ] enlarge video
- [ ] video controls with "space bar"

### Websockets

- [x] Setup backend servers for video
- [x] Manage play state of video
- [x] Manage pause state of video
- [x] Manage time state of video
- [x] Setup backend servers for chat w/ Socket.io
- [x] Sync state with YouTube API
- [x] Setup Rooms
- [x] Setup Users
- [ ] Setup action when User joins room
- [ ] When new users log in, they need updated Video List
- [ ] When new users log in, they need current Playlist state

### DB

- [ ] Database?

### Future Features

- [ ] Integrate with google calendars so users can plan recurring "meetings"

### Resources

#### Similar Projects

- https://github.com/howardchung/watchparty/blob/master/server/room.ts (Hackathon Project)
- https://github.com/filahf/wevid-youtube-together/blob/master/server/server.js (Reddit Post)
- https://github.com/filahf/wevid-youtube-together/blob/master/client/src/components/video/Video.js (Reddit Post)
- https://www.reddit.com/r/reactjs/comments/gh76ez/synchronized_youtube_player_built_in_react/ (Reddit Post)

- https://github.com/bramgiessen/react-youtube-sync/tree/master/server
- https://github.com/YasserYka/YT-Together/blob/master/frontend/src/components/Watch.js

#### Instructions (How To)

- https://www.linode.com/docs/guides/build-react-video-streaming-app/

#### Whiteboard Feature

- https://medium.com/better-programming/building-a-realtime-drawing-app-using-socket-io-and-p5-js-86f979285b12

#### Chat Feature

- https://www.npmjs.com/package/emoji-mart (Emojis)

#### YT Player & React Player Packages

- https://github.com/BTMPL/react-yt
- https://cookpete.com/react-player/

#### App Ideas

- https://dev.to/reedbarger/7-react-projects-you-should-build-in-2021-p20

## Other Resources

- https://www.freecodecamp.org/news/create-a-professional-node-express/
- https://dev.to/armelpingault/how-to-create-a-simple-and-beautiful-chat-with-mongodb-express-react-and-node-js-mern-stack-29l6
- https://github.com/gordonpn/slack-clone

## Project Setup

### Clone and Install

```bash
git clone https://github.com/kevinreber/watch-party.git
cd watch-party
npm install
```

### Environment Variables

Create a `.env` file in the root directory:

- `YOUTUBE_API_KEY`: Enables YouTube video search - [Get YouTube API Credentials](https://developers.google.com/youtube/v3/docs/)

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the project in the browser.

### Build for Production

```bash
npm run build
npm start
```
