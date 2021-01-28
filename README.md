# Watch Party

## ToDo

### Front End

- [x] When user inputs YouTube link, get video id
- [x] Sync player with video playback
- [] Validate YT link before YT id
- [] Create list of queued videos
- [] Users can re-arrange queued videos
- [] Chat interface

### YT Player

- [x] Basic YouTube iframe setup
- [x] Feat: Add volume controls
- [] Feat: Add keyboard arrow features to control video
- [] Disable player controls if no video is loaded
- [] ? If video is removed, next video in queue takes it's place
- [] If last video is removed, need to remove script and show "No Videos Found"
- [] YouTube API
- [] hide ads if possible

### Websockets

- [] Setup backend servers for video
- [] Manage play state of video
- [] Manage pause state of video
- [] Manage time state of video
- [] Setup backend servers for chat w/ Socket.io
- [] Sync state with YouTube API

### DB

- [] Database?

## Available Scripts

In the project directory, you can run:

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
