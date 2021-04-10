// const mongoose = require('mongoose');
// const Schema = mongoose.Schema;
// const opts = require('./options');

// const roomSchema = new Schema(
// 	{
// 		name: {
// 			type: String,
// 			lowercase: true,
// 			required: [true, "can't be blank"],
// 			match: [/^[a-zA-Z0-9]+$/, 'is invalid'],
// 			index: true,
// 		},
// 		owner_id: {
// 			type: mongoose.Schema.Types.ObjectId,
// 			ref: 'User',
// 		},
// 		admins: [{ type: String, ref: 'User' }],
// 		users: [{ type: String, ref: 'User' }],
// 		messages: [
// 			{
// 				content: { type: String, required: true },
// 				username: { type: String, required: true },
// 				user_id: {
// 					type: mongoose.Schema.Types.ObjectId,
// 					ref: 'User',
// 					required: true,
// 				},
// 				created_at: { type: String, required: true },
// 			},
// 		],
// 	},
// 	opts
// );

// const Room = mongoose.model('Room', roomSchema);

const ROOMS = new Map();

/** Room is a collection of listening members; this becomes a "chat room"
 *   where individual users can join/leave/broadcast to.
 */

class Room {
	/** get room by that name, creating if nonexistent
	 *
	 * This uses a programming pattern often called a "registry" ---
	 * users of this class only need to .get to find a room; they don't
	 * need to know about the ROOMS variable that holds the rooms. To
	 * them, the Room class manages all of this stuff for them.
	 **/

	getRoom(roomName) {
		if (!ROOMS.has(roomName)) {
			ROOMS.set(roomName, new Room(roomName));
		}

		return ROOMS.get(roomName);
	}

	/** make a new room, starting with empty set of listeners */
	constructor(roomName, privateRoom = false) {
		this.name = roomName;
		this.private = privateRoom;
		this.users = new Set();
		this.videos = [];
		this.messages = [];
	}

	getUser(username) {
		if (!this.users.has(username)) {
			throw new Error(`${username} not in room: ${this.name}`);
		}

		return this.users.get(username);
	}

	/** toggle privacy of room. */
	toggleRoomPrivacy() {
		this.private = !this.private;
	}

	/** user joining a room. */
	join(username) {
		if (this.users.has(username)) {
			throw new Error(
				`Username "${username}" already exists in room "${this.name}`
			);
		}
		this.users.add(username);
		return this.users;
	}

	/** user leaving a room. */
	leave(username) {
		if (!this.users.has(username)) {
			throw new Error(
				`Username "${username}" does not exists in room "${this.name}"`
			);
		}
		this.users.delete(username);
		return this.users;
	}

	/** add video to videos list. */
	addVideo(video) {
		this.videos.push(video);
	}

	/** remove video from videos list. */
	removeVideo(videoId) {
		const filteredVideos = this.videos.filter((video) => video.id !== videoId);
		this.videos = filteredVideos;
	}

	/** add message to messages list. */
	addMessage(message) {
		this.videos.push(message);
	}

	/** remove message from messages list. */
	removeMessage(messageId) {
		const filteredMessages = this.messages.filter(
			(message) => message.id !== messageId
		);
		this.filteredMessages = filteredMessages;
	}

	/** send message to all members in a room. */

	//   broadcast(data) {
	//     for (let member of this.members) {
	//       member.send(JSON.stringify(data));
	//     }
	//   }
}
module.exports.Room = Room;
module.exports.ROOMS = ROOMS;
// module.export = { ROOMS: ROOMS, Room: Room };
