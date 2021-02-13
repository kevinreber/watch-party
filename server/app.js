/** app for watch party */

const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);

// mongo/mongoose
const uri = process.env.MONGODB_URI;
const Message = require('./models/Message');
const mongoose = require('mongoose');

// mongoose.connect(uri, {
// 	useUnifiedTopology: true,
// 	useNewUrlParser: true,
// });

io.on('connection', (socket) => {
	// Get the last 10 messages from the database.
	// Message.find()
	// 	.sort({ createdAt: -1 })
	// 	.limit(10)
	// 	.exec((err, messages) => {
	// 		if (err) return console.error(err);

	// 		// Send the last messages to the user.
	// 		socket.emit('init', messages);
	// 	});

	socket.on('event', (data) => {
		//  data.state : 'play' | 'pause' | 'seek'
		console.log(data.state, data);
		socket.broadcast.emit('receive-event', data);
	});

	// Listen to connected users for a new message.
	socket.on('send-message', (msg) => {
		console.log(msg);
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
		socket.broadcast.emit('receive-message', msg);
	});
});

module.exports = server;
