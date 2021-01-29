/** app for watch party */

const express = require('express');
const app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);

io.on('connection', (socket) => {
	socket.on('send-play', (data) => {
		console.log('play', data);
	});
	socket.on('send-pause', (data) => {
		console.log('pause', data);
	});
});

module.exports = app;

// Access to XMLHttpRequest at 'http://localhost:3001/socket.io/?EIO=4&transport=polling&t=NTBWre_'
// from origin 'http://localhost:3000' has been blocked by CORS policy: No 'Access-Control-Allow-Origin'
// header is present on the requested resource.

// polling-xhr.js:202 GET http://localhost:3001/socket.io/?EIO=4&transport=polling&t=NTBWre_ net::ERR_FAILED
