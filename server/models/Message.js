const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
	{
		content: String,
		username: String,
		user_id: String,
	},
	{
		timestamps: true,
	}
);

const Message = mongoose.model('Message', messageSchema);
module.exports = Message;
