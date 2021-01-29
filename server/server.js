/** server for watch party */

const server = require('./app');
const PORT = 3001;

server.listen(PORT, () => {
	console.log(`Server starting on port ${PORT}`);
});
