const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const opts = require('./options');

const roomSchema = new Schema(
	{
		name: {
			type: String,
			lowercase: true,
			required: [true, "can't be blank"],
			match: [/^[a-zA-Z0-9]+$/, 'is invalid'],
			index: true,
		},
		owner_id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
		},
		admins: [{ type: String, ref: 'User' }],
		users: [{ type: String, ref: 'User' }],
		messages: [
			{
				content: { type: String, required: true },
				username: { type: String, required: true },
				user_id: {
					type: mongoose.Schema.Types.ObjectId,
					ref: 'User',
					required: true,
				},
				created_at: { type: String, required: true },
			},
		],
	},
	opts
);

const Room = mongoose.model('Room', roomSchema);
module.exports = Room;
