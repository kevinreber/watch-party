# Watch Party

## ToDo

### Front End

- [x] When user inputs YouTube link, get video id
- [x] Sync player with video playback
- [z] Validate YT link before YT id
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
- [ ] Setup Rooms
- [ ] Setup Users
- [ ] Setup action when User joins room

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

#### YT Player Package

- https://github.com/BTMPL/react-yt

#### App Ideas

- https://dev.to/reedbarger/7-react-projects-you-should-build-in-2021-p20

## Available Scripts

In the project directory, you can run:

## Other Resources

- https://www.freecodecamp.org/news/create-a-professional-node-express/
- https://dev.to/armelpingault/how-to-create-a-simple-and-beautiful-chat-with-mongodb-express-react-and-node-js-mern-stack-29l6

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
