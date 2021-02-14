const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const opts = require('./options');

const userSchema = new Schema(
	{
		username: {
			type: String,
			lowercase: true,
			required: [true, "can't be blank"],
			match: [/^[a-zA-Z0-9]+$/, 'is invalid'],
			index: true,
		},
		first_name: {
			type: String,
		},
		last_name: {
			type: String,
		},
		email: {
			type: String,
		},
		password: {
			type: String,
		},
		rooms: [{ type: String, ref: 'Room' }],
	},
	opts
);

const User = mongoose.model('User', userSchema);
module.exports = User;
