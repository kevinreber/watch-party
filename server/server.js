/** server for watch party */
// const app = require('./app');
const PORT = 3001;

// const express = require('express');
// const app = express();
// var server = require('http').createServer(app);

const io = require('socket.io')(PORT);

// const io = require('socket.io')(PORT);

// app.listen(PORT, () => {
// 	console.log(`Server starting on port ${PORT}`);
// });

io.on('connection', (socket) => {
	socket.on('send-play', (data) => {
		console.log('play', data);
	});
	socket.on('send-pause', (data) => {
		console.log('pause', data);
	});
});
