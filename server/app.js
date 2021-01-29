/** app for watch party */

const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);

/**
 * Player Status:
 * -1 = unstarted
 * 0 = ended
 * 1 = playing
 * 2 = paused
 * 3 = buffering
 * 5 = cued
 */
io.on('connection', (socket) => {
	socket.on('event', (data) => {
		if (data.state === 'play') {
			console.log('play', data);
			socket.broadcast.emit('receive-event', data);
		} else if (data.state === 'pause') {
			console.log('pause', data);
			socket.broadcast.emit('receive-event', data);
		} else {
			console.log('new timestamp', data);
			socket.broadcast.emit('receive-event', data);
		}
	});
});

module.exports = server;
