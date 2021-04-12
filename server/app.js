/** app for watch party */

const config = require('./config');
const express = require('express');
const app = express();
const server = require('http').Server(app);
const cors = require('cors');
const io = require('socket.io')(server);

const { searchYoutube } = require('./utils/youtube');

// mongo/mongoose
const Message = require('./models/Message');
const { Room, ROOMS } = require('./models/Room');
const { User, USERS } = require('./models/User');
const mongoose = require('mongoose');

mongoose
	.connect(config.DB_URI, {
		useUnifiedTopology: true,
		useNewUrlParser: true,
		useCreateIndex: true,
		useFindAndModify: false,
	})
	.then(() => console.log('SUCCESS - Connected to DB'))
	.catch((err) => console.error('ERROR connecting to DB:', err));

app.use(express.json());
app.use(cors());

app.get('/login', async (req, res) => {
	console.log('logging in');
});

app.get('/api/youtube', async (req, res) => {
	if (typeof req.query.q === 'string') {
		try {
			const items = await searchYoutube(req.query.q);
			res.json(items);
		} catch {
			return res.status(500).json({ error: 'youtube error' });
		}
	} else {
		return res.status(500).json({ error: 'query must be a string' });
	}
});

io.on('connection', (socket) => {
	const _id = socket.id;
	socket.on('join-room', (username, room) => {
		socket.join(room);
		console.log(`Socket ID:${_id}-"${username}" connected to: Room-${room}`);
		if (!ROOMS.has(room)) {
			ROOMS.set(room, new Room(room));
		}
		const ROOM = ROOMS.get(room);

		// add new user to USERS set
		USERS.set(_id, new User(_id, ROOM, username));
		const USER = USERS.get(_id);
		ROOM.join(_id);

		const content = `${USER.name} has joined the room`;
		const message = {
			type: 'admin',
			content,
			created_at: new Date().getTime(),
			username: 'admin',
		};

		socket.to(ROOM.name).emit('receive-message', message);
	});
	// Get the last 10 messages from the database.
	// Message.find()
	// 	.sort({ createdAt: -1 })
	// 	.limit(10)
	// 	.exec((err, messages) => {
	// 		if (err) return console.error(err);

	// 		// Send the last messages to the user.
	// 		socket.emit('init', messages);
	// 	});

	socket.on('user-update', (data, room) => {
		console.log(data);
		// needs to be io where we emit message to all users
		socket.to(room).broadcast.emit('user-updated', data);
	});

	socket.on('username-change', (user, username, room) => {
		console.log(user, username);
		// needs to be io where we emit message to all users
		socket.to(room).broadcast.emit('username-changed', user, username);
	});

	socket.on('event', (data, room) => {
		//  data.state : 'play' | 'pause' | 'seek'
		console.log(data.state, data);
		// socket.broadcast.emit('receive-event', data);
		socket.to(room).broadcast.emit('receive-event', data);
	});

	socket.on('video-list-event', (data, room) => {
		// data.type : 'add-video' | 'remove-video'
		console.log(data.type, data.video, room);

		const ROOM = ROOMS.get(room);

		if (data.type === 'add-video') ROOM.addVideo(data.video);
		else if (data.type === 'remove-video') ROOM.removeVideo(data.video);

		data.videos = ROOM.videos;
		// socket.broadcast.emit('update-video-list', data);
		socket.to(room).broadcast.emit('update-video-list', data);
	});

	// Listen to connected users for a new message.
	socket.on('send-message', (msg, room) => {
		console.log(msg);
		const ROOM = ROOMS.get(room);
		ROOM.addMessage(msg);

		// Create a message with the content and the name of the user.
		// const message = new Message({
		// 	content: msg.content,
		// 	name: msg.name,
		// });

		// Save the message to the database.
		// message.save((err) => {
		// 	if (err) return console.error(err);
		// });

		// Notify all other users about a new message.
		// socket.broadcast.emit('receive-message', msg);
		socket.to(room).broadcast.emit('receive-message', msg);
	});

	socket.on('disconnect', () => {
		const USER = USERS.get(_id);
		console.log('DISCONNECTING-------------------');
		const serverMsg = `SOCKET ID: ${_id}-${USER.name} disconnected from and Room: ${USER.room.name}`;
		const content = `${USER.name} has left the room`;
		const message = {
			type: 'admin',
			content,
			created_at: new Date().getTime(),
			username: 'admin',
		};
		console.log(serverMsg);
		socket.to(USER.room.name).emit('receive-message', message);
		USER.room.leave(_id);
	});
});

module.exports = server;
