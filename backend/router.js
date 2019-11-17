const express = require('express');
const multer  = require('multer');
const shortid = require('shortid');
const storage = multer.diskStorage({
	destination: './uploads',
	filename(req, file, cb) {
		var re = /(?:\.([^.]+))?$/;
		var extension = re.exec(file.originalname)[1];
		cb(null, shortid.generate() + '.' + extension);
	},
});
const upload = multer({ storage });
const router = express.Router();
const mongoose = require('mongoose');
const passport = require('passport');
const Pusher = require('pusher');
const parser = require('./parser');
const jwt = require('jsonwebtoken');
const secret = process.env.SECRET;
const authorizeUser = require('./authorizer');

// WEBSOCKETS
const pusher = new Pusher({
	appId: process.env.PUSHER_APP_ID,
	key: process.env.PUSHER_APP_KEY,
	secret: process.env.PUSHER_APP_SECRET,
	cluster: 'eu',
	useTLS: true
});

// NOTIFICATIONS API
const webpush = require("web-push");

webpush.setVapidDetails(
  "mailto:support@coven.chat",
  process.env.VAPID_PUBLIC,
  process.env.VAPID_SECRET
)

router.get('/api/webpush/get-key', function(req, res) {
	res.send(process.env.VAPID_PUBLIC);
})

router.post('/api/webpush/register', function(req, res) {
	User.update({_id: req.body.userID}, {webpushSubscription: JSON.stringify(req.body.subscription)})
	.then(response => {
		console.log(response);
		res.status(201);
	})
})

function sendPush(userID, payload) {
	User.findById(userID)
	.then(user => {
		if (user.settings.allowNotifications) {
			if (user.webpushSubscription) {
				let subscription = JSON.parse(user.webpushSubscription);
				webpush.sendNotification(subscription, payload)
				  .then(function() {
				    return {result: "success"};
				  })
				  .catch(function(error) {
					  return {result: "error", error: error};
				  });
			} else {
				console.log("No subscription")
				return {result: "error", error: "No subscription"};
			}
		} else {
			console.log("Not allowed to send notifications to user");
			return {result: "error", error: "No subscription"};
		}

	})
}

router.post('/api/webpush/send', async function(req, res) {
	let push = await sendPush(req.body.userID, req.body.payload)
	if (push.result && push.result === "success") {
		res.sendStatus(201);
	} else {
		console.log(error);
		res.sendStatus(500);
	}
});

router.post('/api/permission/update/:permission', authorizeUser, async function(req, res) {
	let permission = req.params.permission === "webpush" ? "webpushPermissionRequested" : "geolocationPermissionRequested";
	User.update({_id: req.user._id}, {[`${permission}`]: true})
	.then(response => {
		if (response.ok) {
			res.sendStatus(200);
		} else {
			console.log(response.error);
			res.sendStatus(500);
		}
	})
});


router.post('/api/user/authenticate', function(req, res) {
	const { username, password } = req.body;
	User.findOne({ username }, function(err, user) {
		if (err) {
			console.error(err);
			res.status(500)
			.json({
				message: 'Internal error! Please try again.'
			});
		} else if (!user) {
			console.error('Incorrect username or password');
			res.status(401)
			.json({
				message: 'Incorrect username or password.'
			});
		} else {
			user.isCorrectPassword(password, function(err, same) {
				if (err) {
					console.error('Internal error! Please try again');
					res.status(500)
					.json({
						message: 'Internal error! Please try again.'
					});
				} else if (!same) {
					console.error('Incorrect username or password (but user exists)');
					res.status(401)
					.json({
						message: 'Incorrect username or password.'
					});
				} else {
					// Issue token
					const payload = { user };
					const token = jwt.sign(payload, secret, {
						expiresIn: '7d'
					});
					res.cookie('token', token, { httpOnly: true })
					.status(200)
					.json({success: true})
				}
			});
		}
	});
});

router.get('/api/pusher/getkey', authorizeUser, function(req, res) {
	res.status(200).json({
		key: process.env.PUSHER_APP_KEY
	});
});

router.get('/api/user/verify', authorizeUser, function(req, res) {
	res.status(200).json({
		user: req.user
	});
});

router.get('/api/user/fetch/:userID', authorizeUser, function(req, res) {
	User.findById(req.params.userID)
	.then(user => {
		res.status(200).json({
			user: user
		});
	})
});

router.get('/api/user/fetch-by-username/:username', authorizeUser, function(req, res) {
	User.find({username: req.params.username})
	.then(user => {
		if (user === undefined || user.length == 0) {
			res.sendStatus(404);
		} else {
			res.status(200).json({
				user: user
			});
		}
	})
});

router.post('/api/user/logout', authorizeUser, function(req, res) {
	res.clearCookie('token').sendStatus(200);
});


router.post('/api/user/register', async function(req, res) {
	const { username, email, password } = req.body;
	usernameTaken = User.findOne({
		username: username
	})
	emailExists = User.findOne({
		email: email
	})
	if (await usernameTaken) {
		res.status(500)
		.json({message: "Sorry, this username is taken."});
	} else if (await emailExists) {
		res.status(500)
		.json({message: "An account with this email already exists. Is it yours?"});
	} else {
		const user = new User({ username, email, password });
		user.save()
		.then(response => {
			Room.findOne({
				name: 'Global Coven'
			})
			.then(globalCoven => {
				globalCoven.members.push({user: user._id, role: 'member'});
				globalCoven.save()
				.then(response => {
					let newAltar = new Altar({
						user: user._id,
						cells: [{type: 'empty', contents: ''},{type: 'text', contents: 'As above, so below'},{type: 'empty', contents: ''},{type: 'empty', contents: ''},{type: 'image', contents: 'hermetica-F032-pentacle'},{type: 'empty', contents: ''},{type: 'empty', contents: ''},{type: 'empty', contents: ''},{type: 'empty', contents: ''}]
					})
					newAltar.save()
					.then(response => {
						res.status(200)
						.json({success: true})
					})
				})
			})
		})
		.catch(error => {
			console.log(err)
			res.status(500)
			.json({message: "Error registering new user! Please try again."});
		});
	}
});

router.post('/api/user/settings/update', authorizeUser, async function(req, res) {
	let subValue = req.body.type == "statusBar" ? ".set" : "";
	User.update({_id: req.user._id},{
		$set: { [`settings.${req.body.setting}${subValue}`]: req.body.value }
	})
	.then(response => {
		if (response.ok) {
			User.findById(req.user._id)
			.then(user => {
				console.log(user)
				res.status(200).json({
					user: user
				})
			})
		}
	})
});

router.get('/api/user/fetch-notifications', authorizeUser, async function(req, res) {
	User.findById(req.user._id)
	.then(user => {
		if (user) {
			res.status(200).json({
				username: user.username,
				notifications: user.notifications
			})
		}
	})
})

router.post('/api/user/send-notification', authorizeUser, async function(req, res) {
	let notificationID = new mongoose.Types.ObjectId();
	User.update({username: req.body.user}, {$push: {notifications: {...req.body.notification, _id: notificationID, sender: req.user.username}}})
	.then(response => {
		if (response.ok){
			pusher.trigger('notifications', 'notification-sent', {username: req.body.user, notification: {...req.body.notification, _id: notificationID}}, req.body.socketId)
			res.sendStatus(200);
		}
	})
})

router.post('/api/user/delete-notification', authorizeUser, function(req, res) {
	console.log("Deleting notification", req.body)
	User.update({username: req.body.username}, {$pull: {notifications: {_id: req.body.notificationID}}})
	.then(response => {
		console.log(response)
		if (response.ok){
			res.sendStatus(200);
		}
	})
})

router.post('/api/link/upsert', authorizeUser, async function(req, res) {
	// Find users' geolocations
	let fromCoordinates = req.body.fromCoordinates || await User.find({username: req.body.fromUsername}, {geolocation: 1});
	let toCoordinates = req.body.toCoordinates || await User.find({username: req.body.toUsername}, {geolocation: 1});
	// Format coordinates correctly if they're from the database
	if (!req.body.fromCoordinates && !req.body.toCoordinates) {
		console.log("Using db coords")
		fromCoordinates = [fromCoordinates[0].geolocation.longitude, fromCoordinates[0].geolocation.latitude];
		toCoordinates = [toCoordinates[0].geolocation.longitude, toCoordinates[0].geolocation.latitude];
	} else {
		console.log("Using supplied coords")
	}
	if (fromCoordinates && toCoordinates) {
		let linkDuration = 60 * 60 * 1000; // 1 hour in milliseconds
		let now = new Date().getTime();
		let upsertLink = Link.findOneAndUpdate({fromUsername: req.body.fromUsername, toUsername: req.body.toUsername},
		{
			fromUsername: req.body.fromUsername,
			toUsername: req.body.toUsername,
			fromCoordinates: fromCoordinates,
			toCoordinates: toCoordinates,
			expiryTime: now + linkDuration,
		}, { new: true, upsert: true })
		.then(response => {
			setTimeout(() => {
				Link.remove({_id: response._id})
				.then(result => {
					console.log(result);
					pusher.trigger('geolocations', 'link-expired', {id: response._id}, req.body.socketId)
				})
			}, linkDuration)
			pusher.trigger('geolocations', 'link-created', {link: {...response._doc, revision: req.body.revision}}, req.body.socketId)
		})
	} else {
		// No coordinates found
		console.error("No coordinates found or supplied, exiting.")
	}
})

router.post('/pusher/auth', function(req, res) {
	var socketId = req.body.socket_id;
	var channel = req.body.channel_name;
	var auth = pusher.authenticate(socketId, channel);
	res.send(auth);
});

router.post('/api/geolocation/update', authorizeUser, function(req,res) {
	let now = new Date();
	var payload = {
		longitude: req.body.position.longitude,
		latitude: req.body.position.latitude,
		expiry: now.setTime(now.getTime() + (1*60*60*1000)), // Location is displayed for one hour
		updated: now.getTime()
	}

	User.update({_id: req.user._id}, {geolocation: payload})
	.then(response => {
		pusher.trigger('geolocations', 'geolocation-updated', {user: req.user, geolocation: payload}, req.body.socketId)
	})
});

router.get('/api/geolocation/fetch-all', authorizeUser, async function(req,res) {
	let now = new Date().toISOString();
	let users = await User.find({_id: { $ne: req.user._id }, "geolocation.expiry": { $gte: now }})
	let links = await Link.find({expiryTime: { $gte: now }})
	res.status(200).json({
		users: users,
		links: links
	})
});

router.post('/api/chat/message/new', authorizeUser, async function(req,res) {
	var parsedMessage = parser(req.body.content);
	if (!parsedMessage.isValid) return false;
	var message = new Message({
		user: req.user._id,
		timestamp: new Date(),
		type: parsedMessage.type,
		room: req.body.room,
		content: parsedMessage.content,
		tarot: parsedMessage.tarot,
		runes: parsedMessage.runes,
		mentions: parsedMessage.mentions,
		readBy: [req.user._id]
	});
	message.save()
	.then(message => {
		Message.findById(message._id)
		.populate('user')
		.populate('room')
		.then(retrievedMessage => {
			if (parsedMessage.mentions) {
				parsedMessage.mentions.forEach(async (mention) => {
					let user = await User.find({username: mention})
					let joinedRooms = await Room.find({members: {$elemMatch: {user:user[0]._id}}, hiddenBy: {$ne: user[0]._id}})
					if (user && joinedRooms.some(r => r.slug === retrievedMessage.room.slug)) {
						let roomName = retrievedMessage.room.name || "a private message";
						sendPush(user[0]._id, req.user.username + " has mentioned you in " + roomName + ".");
					} else {
						console.log("No such user:", mention)
					}
				})
			}
			pusher.trigger('messages', 'message-sent', retrievedMessage, req.body.socketId)
		})
	})
});

router.post('/api/chat/message/read/:messageID', authorizeUser, async function(req,res) {
	Message.findById(req.params.messageID)
	.then(message => {
		// Check if user is already marked as having read the message
		if (!message.readBy.some(u => u.equals(req.user._id))){
			message.readBy.push(req.user._id)
			message.save()
			.then(response => {
				pusher.trigger('messages', 'message-read', {user: req.user, message: message});
				res.sendStatus(200);
			})
		} else {
			res.sendStatus(400);
		}
	})
});

router.get('/api/chat/room/fetch-all', authorizeUser, function(req,res) {
	var rooms = Room.find()
	.then(rooms => {
		res.json(rooms);
	})
});

router.get('/api/chat/room/fetch-public', authorizeUser, function(req,res) {
	var rooms = Room.find({
		public: true,
		members: {
			$not: {
				$elemMatch: {user: req.user._id}
			}
		}
	})
	.then(rooms => {
		res.json(rooms);
	})
});

router.get('/api/chat/room/fetch-joined', authorizeUser, async function(req,res) {
	var rooms = Room.find({members: {$elemMatch: {user:req.user._id}}, hiddenBy: {$ne: req.user._id}}).populate('members.user').sort('name')
	.then(async rooms => {
		async function getUnreadMessages (rooms) {
			const promiseArray = rooms.map(async room => {
				const otherUser = false;
				if (room.type === "direct-message") {
					const otherUser = room.members.find(m => m.user.username !== req.user.username);
				}
				const unreadMessages = await Message.find({
					room: room._id,
					readBy: { $ne: req.user._id }
				})
				.then(unreadMessages => {
					return unreadMessages.length;
				})
				return {...room._doc, unreadMessages: unreadMessages, otherUser: otherUser};
			});
			const finalArray = await Promise.all(promiseArray);
			return finalArray;
		}
		let roomsWithUnreadIndicators = await getUnreadMessages(rooms);
		res.json(roomsWithUnreadIndicators);
	})
});

router.get('/api/chat/room/fetch/:room', authorizeUser, async function(req,res) {
	let targetSlug = 'global-coven';
	let showWelcomeMessage = true;
	let roomSlugs = await Room.find({},{ slug: 1 });
	let arrayOfSlugs = roomSlugs.map(s => s.slug);
	if (arrayOfSlugs.includes(req.params.room)) {
		targetSlug = req.params.room;
	}
	let room = await Room.findOne({
		slug: targetSlug
	})
	.populate('members.user')
	.populate('visitors');

	// var startOfToday = new Date().setHours(0,0,0,0);
	let messages = await Message.find({
		room: room._id,
		// timestamp: {$gte: startOfToday}
	})
	.sort('-timestamp')
	.limit(30)
	.populate('user');

	messages.reverse();

	// Work out if we should be showing this user a welcome message
	if (room.members.some(m => m.user.equals(req.user._id) && m.showWelcomeMessage == false)) {
		showWelcomeMessage = false;
	}
	// Mark all messages in room as read (simple hack for now)
	Message.update({
		room: room._id,
		readBy: { $ne: req.user._id }
	},
	{ $push: { readBy: req.user._id } }, {multi: true})
	.then(response => {
		console.log(response)
		// pusher.trigger('general', 'messages-read', {user: req.user, room: targetSlug, roomType: room.type})
		res.status(200)
		.json({
			messages: messages,
			room: room,
			showWelcomeMessage: showWelcomeMessage
		});
	});
});

router.post('/api/chat/room/fetch-messages', authorizeUser, function(req,res) {
	Message.find({
		room: req.body.room,
		_id: {$lt: req.body.earlierThan}
	})
	.sort('-timestamp')
	.limit(30)
	.populate('user')
	.then(messages => {
		messages.reverse();
		res.status(200)
		.json({
			messages: messages
		});
	})
})

router.post('/api/chat/room/create', authorizeUser, function(req,res) {
	const { roomType, roomName, roomDescription, roomPrivacy } = req.body;
	let roomID = mongoose.Types.ObjectId();
	if (roomType === "direct-message") {
		roomSlug = roomID.toString();
		roomMembers = req.body.roomMembers
	} else {
		roomSlug = req.body.roomSlug;
		roomMembers = [{user: req.user._id, role: 'administrator'}];
	}
	var room = new Room({
		_id: roomID,
		type: roomType,
		slug: roomSlug,
		name: roomName,
		description: roomDescription,
		public: (roomPrivacy == 'public' ? true : false),
		members: roomMembers
	})
	room.save()
	.then(room => {
		User.update({_id: req.user._id}, { $set: {'memory.lastRoom': room.slug}})
		.then(response => {
			if (roomType === "direct-message") {
				pusher.trigger('general', 'direct-message-room-created', {room: room, sender: req.user, recipient: req.body.recipient});
			} else {
				pusher.trigger('general', 'room-created', {room: room, user: req.user});
			}
			res.sendStatus(200);
		})
	})
});

router.post('/api/chat/room/edit', authorizeUser, function(req,res) {
	const { roomID, roomSlug, roomName, roomDescription, roomWelcomeMessage, roomAdmins, roomMembers } = req.body;
	Room.findById(roomID)
	.then(room => {
		let oldSlug = room.slug;
		let adminsIDs = roomAdmins.map(a => a.id)
		let membersIDs = roomMembers.map(a => a.id)
		room.members.forEach(async (member) => {
			var oldRole, newRole;
			oldRole = member.role;
			member.role = "member";

			if (adminsIDs.includes(member.user.toString())) {
				member.role = "administrator";
				newRole = "administrator";
			} else {
				newRole = false;
			}
			if (oldRole == "member" && newRole == "administrator") {
				var newAdmin = await User.findById(member.user);
				var message = new Message({
					user: req.user._id,
                    timestamp: new Date(),
                    type: 'alert',
                    room: room._id,
                    content: 'has given administrator privileges to ' + newAdmin.username,
					readBy: [req.user._id]
				})
				message.save();
			}
			if (oldRole == "administrator" && newRole == false) {
				var newMember = await User.findById(member.user);
				var message = new Message({
					user: req.user._id,
                    timestamp: new Date(),
                    type: 'alert',
                    room: room._id,
                    content: 'has removed administrator privileges from ' + newMember.username,
					readBy: [req.user._id]
				})
				message.save();
			}
		});
		// Show all users updated welcome message
		if (room.welcomeMessage != roomWelcomeMessage) {
			room.members.map(u => u.showWelcomeMessage = true);
		}
		room.slug = roomSlug;
		room.name = roomName;
		room.description = roomDescription;
		room.welcomeMessage = roomWelcomeMessage;
		room.save();
		var message = new Message({
			user: req.user._id,
			timestamp: new Date(),
			type: 'alert',
			room: room._id,
			content: 'has edited the Coven settings',
			readBy: [req.user._id]
		})
		message.save()
		.then(response => {
			User.update({"memory.lastRoom": oldSlug}, { $set: { "memory.lastRoom": roomSlug }})
			.then(response => {
				pusher.trigger('general', 'room-edited', room, req.body.socketId);
				res.sendStatus(200);
			})
		})
	})
});

router.post('/api/chat/room/hide/:room', authorizeUser, function(req,res) {
	Room.update({slug: req.params.room}, { $push: { hiddenBy: req.user._id } })
	.then(response => {
		console.log(response);
		res.status(200).json({
			room: req.params.room
		});
	})
})

router.post('/api/chat/room/enter/:room', authorizeUser, async function(req,res) {
	Room.findOne({
		slug: req.params.room
	})
	.then(room => {
		User.update({_id: req.user._id}, { $set: {'memory.lastRoom': req.params.room}});
		// Check if this user is a member or just visiting
		if (room.members.some(m => m.user.equals(req.user._id))) {
			pusher.trigger('general', 'member-entered-room', {room: room, user: req.user}, req.body.socketId);
			res.sendStatus(200);
		} else {
			// Check if user is already in the visitors array
			if (!room.visitors.some(v => v.equals(req.user._id))) {
				room.visitors.push(req.user._id)
				room.save()
				.then(room => {
					pusher.trigger('general', 'visitor-entered-room', {room: room, user: req.user}, req.body.socketId);
					res.sendStatus(200);
				})
			} else {
				console.log(req.user.username + " is already a visitor in this room")
				pusher.trigger('general', 'visitor-entered-room', {room: room, user: req.user}, req.body.socketId);
				res.sendStatus(200);
			}
		}
	});
});

router.post('/api/chat/room/exit/:room', authorizeUser, function(req,res) {
	Room.findOne({
		slug: req.params.room
	})
	.then(room => {
		// Check if this user is a member or just visiting
		if (room.members.some(m => m.user.equals(req.user._id))) {
			pusher.trigger('general', 'member-left-room', {room: room, user: req.user}, req.body.socketId);
			res.sendStatus(200);
		} else {
			// Check if user is in the visitors array
			if (room.visitors.some(v => v.equals(req.user._id))) {
				room.visitors = room.visitors.filter(v => !v.equals(req.user._id))
				room.save()
				.then(room => {
					pusher.trigger('general', 'visitor-left-room', {room: room, user: req.user}, req.body.socketId);
					res.sendStatus(200);
				})
			} else {
				console.log(req.user.username + " wasn't a visitor in this room (apparently)");
				pusher.trigger('general', 'visitor-left-room', {room: room, user: req.user}, req.body.socketId);
				res.sendStatus(200);
				// Do nothing?
			}
		}
	});
});

router.post('/api/chat/room/join/:room', authorizeUser, function(req,res) {
	Room.findOne({
		slug: req.params.room
	})
	.then(room => {
		// Check if this user is already a member
		if (room.members.some(m => m.user.equals(req.user._id))) {
			console.log(req.user.username + " is already a member of " + room.name);
			res.sendStatus(200);
		} else {
			// Remove user from visitors array, if in array
			if (room.visitors.some(v => v.equals(req.user._id))) {
				room.visitors = room.visitors.filter(v => !v.equals(req.user._id));
			}
			// Add user to members array (making them an admin if there's no other members in the room)
			room.members.push({user: req.user._id, role: (room.members.length == 0 ? 'administrator' : 'member')});
			room.save()
			.then(room => {
				var message = new Message({
					user: req.user._id,
                    timestamp: new Date(),
                    type: 'alert',
                    room: room._id,
                    content: 'has joined',
					readBy: [req.user._id]
				})
				message.save()
				.then(response => {
					pusher.trigger('general', 'user-joined-room', {room: room, user: req.user}, req.body.socketId);
					res.sendStatus(200);
				})
			});
		}
	});
});

router.post('/api/chat/room/leave/:room', authorizeUser, function(req,res) {
	Room.findOne({
		slug: req.params.room
	})
	.then(room => {
		// Remove user from members array, if in array
		if (room.members.some(v => v.user.equals(req.user._id))) {
			room.members = room.members.filter(v => !v.user.equals(req.user._id));
		}
		// Check if this user is already a visitor
		if (room.visitors.some(m => m.equals(req.user._id))) {
			console.log(req.user.username + " is already a visitor in " + room.name);
			res.sendStatus(200);
		} else {
			// Only add user to visitors array if it's a public room
			if (room.public == true){
				// Add user to visitors array
				room.visitors.push(req.user._id);
			}
		}
		// If there is now only one member in the room, they become an admin
		if (room.members.length === 1) {
			room.members[0].role = "administrator";
		}
		// Reset leaving user's last saved room memory
		User.update({_id: req.user._id}, { $set: {'memory.lastRoom': 'global-coven'}});
		room.save()
		.then(room => {
			var message = new Message({
				user: req.user._id,
				timestamp: new Date(),
				type: 'alert',
				room: room._id,
				content: 'has left',
				readBy: [req.user._id]
			})
			message.save()
			.then(response => {
				pusher.trigger('general', 'user-left-room', {room: room, user: req.user}, req.body.socketId);
				res.sendStatus(200);
			})
		});
	});
});

router.post('/api/chat/room/hidewelcomemessage/:room', authorizeUser, function(req,res) {
	Room.findOne({
		slug: req.params.room
	})
	.then(room => {
		room.members.map(m => {
			if (m.user.equals(req.user._id)) {
				m.showWelcomeMessage = false;
			}
		})
		room.save()
		.then(result => {
			res.sendStatus(200);
		})
	})
});

router.post('/api/chat/room/invite/:room/:userID', authorizeUser, function(req,res) {
	Room.findOne({
		slug: req.params.room
	})
	.then(async (room) => {
		let user = await User.findById(req.params.userID)
		if (user) {
			// Check if user is already in room
			if (room.members.some(m => m.user.equals(req.params.userID))) {
				res.sendStatus(500);
			} else {
				room.members.push({
					user: req.params.userID,
					role: 'member'
				});
				room.save()
				.then(result => {
					pusher.trigger('general', 'user-invited-to-room', {room: room, user: user}, req.body.socketId);
					res.sendStatus(200);
				})
			}
		}
	})
});

router.get('/api/altar/fetch/:userID', authorizeUser, async function(req,res) {
	let altar = await Altar.findOne({
		user: req.params.userID
	})
	let posts = await Post.find({user: req.params.userID}).populate('user');
	if (altar) {
		res.status(200).json({
			altar: altar,
			posts: posts
		});
	} else {
		res.status(404);
	}
})

router.post('/api/altar/edit-cell/contents', authorizeUser, function(req,res) {
	let targetCell = Object.keys(req.body.payload)[0];
	let newValue = req.body.payload[targetCell];
	let cellIndex = parseInt(targetCell.slice(5)) - 1;

	Altar.update({
		user: req.user._id
	},
	{
		$set: {
			[`cells.${cellIndex}.contents`]: newValue
		}
	})
	.then(response => {
		res.status(200).json({
			index: cellIndex,
			value: newValue
		});
	})
})

router.post('/api/altar/edit-cell/type', authorizeUser, function(req,res) {
	let targetCell = Object.keys(req.body.payload)[0];
	let newType = req.body.payload[targetCell];
	let cellIndex = parseInt(targetCell.slice(5)) - 1;
	Altar.update({
		user: req.user._id
	},
	{
		$set: {
			[`cells.${cellIndex}.type`]: newType,
			[`cells.${cellIndex}.contents`]: ''
		}
	})
	.then(response => {
		res.status(200).json({
			index: cellIndex,
			type: newType
		});
	})
})

router.post('/api/altar/edit-cell/color', authorizeUser, function(req,res) {
	let targetCell = Object.keys(req.body.payload)[0];
	let newColor = req.body.payload[targetCell];
	let cellIndex = parseInt(targetCell.slice(5)) - 1;
	Altar.update({
		user: req.user._id
	},
	{
		$set: {
			[`cells.${cellIndex}.color`]: newColor
		}
	})
	.then(response => {
		res.status(200).json({
			index: cellIndex,
			color: newColor
		});
	})
})

router.post('/api/altar/edit-background', authorizeUser, function(req,res) {
	let newColor = req.body.color;
	Altar.update({
		user: req.user._id
	},
	{
		$set: {
			backgroundColor: newColor
		}
	})
	.then(response => {
		res.status(200).json({
			color: newColor
		});
	})
})

router.post('/api/altar/candle/new', authorizeUser, function(req,res) {
	let candleID = mongoose.Types.ObjectId();
	let newCandle = {...req.body.candle, _id: candleID}
	Altar.update({
		user: req.user._id
	},
	{
		$push: {
			candles: newCandle
		}
	})
	.then(response => {
		console.log(response);
		res.status(200).json({
			candle: newCandle
		});
	})
})

router.post('/api/altar/candle/delete/:candleID', authorizeUser, function(req,res) {
	Altar.update({user: req.user._id}, { $pull: { candles: { _id: req.params.candleID }}})
	.then(response => {
		console.log(response)
		Altar.find({user: req.user._id},{candles:1})
		.then(candles => {
			res.status(200).json({
				candles: candles[0].candles
			});
		})
	})
})

router.post('/api/image/upload', authorizeUser, upload.single('image'), (req, res) => {
	const image = req.file;
	const meta = req.body;
	let dbDoc = new Image({
		filename: req.file.filename,
		uploader: req.user._id
	})
	dbDoc.save()
	.then(response => res.status(200).json(response))
	.catch((error) => res.status(500).json(error));
});

router.post('/api/post/new', authorizeUser, (req, res) => {
	let post = new Post({
		user: req.user._id,
		title: req.body.title,
	    content: req.body.text,
	    category: req.body.category,
	    public: req.body.privacy === "public" ? true : false,
	})
	post.save()
	.then(response => res.status(200).json(response))
	.catch((error) => res.status(500).json(error));
});

router.post('/api/post/edit', authorizeUser, (req, res) => {
	Post.findOneAndUpdate({_id: req.body.id}, {
		title: req.body.title,
		content: req.body.text,
		category: req.body.category,
		public: req.body.privacy === "public" ? true : false,
	}, {new: true})
	.then(response => {
		console.log(response)
		res.status(200).json(response)
	})
	.catch((error) => res.status(500).json(error));
});

router.post('/api/post/delete', authorizeUser, (req, res) => {
	Post.remove({_id: req.body._id})
	.then(response => res.status(200).json(response))
	.catch((error) => res.status(500).json(error));
});

module.exports = router;
