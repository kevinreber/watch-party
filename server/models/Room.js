const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const roomSchema = new Schema(
	{
		username: {
			type: String,
			lowercase: true,
			required: [true, "can't be blank"],
			match: [/^[a-zA-Z0-9]+$/, 'is invalid'],
			index: true,
		},
		ownerId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
		},
		messages: [
			{
				content: { type: String, required: true },
				senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
			},
			{
				timestamps: true,
			},
		],
	},
	{
		timestamps: true,
	}
);

const Room = mongoose.model('Room', roomSchema);
module.exports = Room;
