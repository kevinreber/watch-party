/** app for watch party */

const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);

io.on('connection', (socket) => {
	socket.on('event', (data) => {
		//  data.state : 'play' | 'pause' | 'seek'
		console.log(data.state, data);
		socket.broadcast.emit('receive-event', data);
	});
});

module.exports = server;
