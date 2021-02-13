/** server for watch party */

const server = require('./app');
const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
	console.log(`Server starting on port ${PORT}`);
});
