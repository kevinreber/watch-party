/** app for watch party */

const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);

io.on('connection', (socket) => {
	socket.on('send-play', (data) => {
		console.log('play', data);
	});
	socket.on('send-pause', (data) => {
		console.log('pause', data);
	});
});

module.exports = server;
