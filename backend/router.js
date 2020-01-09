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
const fs = require('fs');
const upload = multer({ storage });
const router = express.Router();
const mongoose = require('mongoose');
const passport = require('passport');
const parser = require('./parser');
const jwt = require('jsonwebtoken');
const secret = process.env.SECRET;
const authorizeUser = require('./authorizer');
const crypto = require('crypto');

// NODEMAILER
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
	host: process.env.EMAIL_SERVER,
	port: 587,
	secure: false, // upgrade later with STARTTLS
	auth: {
		user: process.env.EMAIL_USERNAME,
		pass: process.env.EMAIL_PASSWORD
	}
});
transporter.verify(function(error, success) {
	if (error) {
		console.log("Email server error!")
		console.log(error); 
	} else {
		console.log("Email server is ready to take our messages");
	}
});

// SOCKET.IO
const server = require('http').createServer(express);
const io = require('socket.io')(server, { origins: '*:*'});
server.listen(process.env.SOCKET_PORT);
io.on('connection', function(socket) {
	socket.on('user-online', payload => {
		console.log(payload.username, "is online")
		console.log("Socket ID:",socket.id);
		// Connect socket to all rooms of which user is a member
		Room.find({members: {$elemMatch: {user:payload._id}}, hiddenBy: {$ne: payload._id},bannedUsers: {$ne: payload._id}})
		.then(joinedRooms => {
			joinedRooms.forEach(room => {
				socket.join(room.slug);
				console.log('Joined', room.slug)
			})
		});
		// Update user's socket ID field to ID of current connection
		User.update({_id: payload._id}, {socketID: socket.id}).then(update => console.log(update));
		// Send updated user connection to all clients
		io.emit('user-connection-updated', {user: payload._id, lastOnline: new Date()});
	})
	socket.on('disconnect', () => {
		console.log('A user disconnected from Socket.IO');
		// io.emit('user-connection-updated', {user: payload._id, lastOnline: new Date()});
	});
	socket.on('join-socketio-room', room => {
		socket.join(room);
		console.log('Joined', room)
	});
	socket.on('send-message', (message, cb) => {
		console.log("Here he is a message", message)
		var parsedMessage = parser(message.content);
		if (!parsedMessage.isValid) return cb(false);
		var message = new Message({
			user: message.user,
			timestamp: new Date(),
			type: parsedMessage.type,
			room: message.room,
			content: parsedMessage.content,
			tarot: parsedMessage.tarot,
			runes: parsedMessage.runes,
			mentions: parsedMessage.mentions,
			readBy: [message.user]
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
						let joinedRooms = await Room.find({members: {$elemMatch: {user:user[0]._id}}, hiddenBy: {$ne: user[0]._id},bannedUsers: {$ne: user[0]._id}})
						if (user && joinedRooms.some(r => r.slug === retrievedMessage.room.slug)) {
							let roomName = retrievedMessage.room.name || "a private message";
							sendPush(user[0]._id, retrievedMessage.user.username + " has mentioned you in " + roomName + ".");
						} else {
							console.log("No such user:", mention)
						}
					})
				}
				io.in(retrievedMessage.room.slug).emit('message-sent', retrievedMessage);
				cb(true);
			})
		})
	});
});

// // WEBSOCKETS
// const pusher = new Pusher({
// 	appId: process.env.PUSHER_APP_ID,
// 	key: process.env.PUSHER_APP_KEY,
// 	secret: process.env.PUSHER_APP_SECRET,
// 	cluster: 'eu',
// 	useTLS: true
// });

// NOTIFICATIONS API
const webpush = require("web-push");
webpush.setVapidDetails(
  "mailto:support@coven.chat",
  process.env.VAPID_PUBLIC,
  process.env.VAPID_SECRET
)

const sendNotification = (payload) => {
	let notificationID = new mongoose.Types.ObjectId();
	User.findOneAndUpdate({username: payload.user}, {$push: {notifications: {...payload.notification, _id: notificationID, sender: payload.user}}}, {new: true})
	.then(updatedUser => {
		io.to(updatedUser.socketID).emit('notification-sent', {username: payload.user, notification: {...payload.notification, _id: notificationID}})
		return true;
	})
	.catch(error => {
		return false;
	})
}


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

// router.get('/api/pusher/getkey', authorizeUser, function(req, res) {
// 	res.status(200).json({
// 		key: process.env.PUSHER_APP_KEY
// 	});
// });

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

router.get('/api/user/checkresetpasswordtoken/:token', function(req, res) {
	User.findOne({resetPasswordToken: req.params.token, resetPasswordTokenExpiry: { $gt: Date.now()}})
	.then(user => {
		if (user) {
			res.status(200).json({
				email: user.email
			});
		} else {
			res.sendStatus(400);
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

router.post('/api/user/sendresetpasswordlink', function(req,res) {
	User.findOne({
		email: req.body.email
	})
	.then(user => {
		if (user) {
			// Create the random token
			let token = crypto.randomBytes(20).toString('hex');

			User.findByIdAndUpdate(
				{ _id: user._id },
				{
					resetPasswordToken: token,
					resetPasswordTokenExpiry: Date.now() + 86400000
				},
				{ upsert: true, new: true }
			)
			.then(response => {
				if (response) {
					// Send the email!
					let resetEmail = {
						from: 'support@coven.chat',
						to: user.email,
						subject: 'We heard you forgot your password',
						html: '<p>Hi ' + user.username + '!</p><p>Someone (hopefully you!) just requested a password reset link for this account on CovenChat.</p><p>If this was you, follow this link to reset your password: <a href="https://localhost:3000/reset-password?token=' + token + '">https://localhost:3000/reset-password?token=' + token + '</a>.</p><p>If this wasn\'t you, chances are someone put your email in by mistake. Don\'t worry, your account is safe and this link will expire in 24 hours.</p><p>Love,</p><p>CovenChat Support</p>'
					};
					transporter.sendMail(resetEmail, function(err, info) {
						console.log(info)
						if (err) {
							console.log(err)
							res.status(500)
							.json({message: "Error sending email! Please try again."});
						} else {
							res.status(200)
							.json({success: true})
						}
					})
				} else {
					console.log(response)
					res.status(500)
					.json({message: "Error sending email! Please try again."});
				}
			})
		} else {
			// A user with this email does not exist - fail silently.
			console.log("No user with specified email for password reset")
			res.status(200)
			.json({success: true})
		}
	})
});

router.post('/api/user/resetpassword', async function(req, res) {
	const { password, passwordRepeat, token } = req.body;
	if (password === passwordRepeat) {
		// Check token again
		User.findOne({resetPasswordToken: token, resetPasswordTokenExpiry: { $gt: Date.now()}})
		.then(user => {
			console.log(user)
			if (user) {
				user.password = password;
				user.resetPasswordToken = '';
				user.resetPasswordTokenExpiry = '';
				user.save()
				.then(result => {
					console.log(result)
					if (result) {
						console.log("Password successfully reset!")
						let resetEmail = {
							from: 'support@coven.chat',
							to: user.email,
							subject: 'Your password has been changed',
							html: '<p>Hi ' + user.username + '!</p><p>The password for your account on CovenChat has been sucessfully changed.</p><p>If you didn\'t do this, get in touch with us right away by replying to this email and we\'ll sort it out.</p><p>Love,</p><p>CovenChat Support</p>'
						};
						transporter.sendMail(resetEmail, function(err, info) {
							console.log(info)
							if (err) {
								console.log(err)
								res.status(500)
								.json({message: "Error resetting password. Please try again."});
							} else {
								res.status(200)
								.json({success: true})
							}
						});
					} else {
						res.status(500)
						.json({message: "Error resetting password. Please try again."});
					}
				})
			} else {
				res.status(500)
				.json({message: "Error resetting password. Please try again."});
			}
		})
	} else {
		res.status(500)
		.json({message: "The supplied passwords do not match."});
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
				io.emit('user-setting-updated', {user: user.username, keyToChange: req.body.setting, newValue: req.body.value});
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
	console.log("Creating a notification!",req.body.notification)
	sendNotification({user: req.body.user, notification: req.body.notification});
	// if (notification) {
	// 	res.sendStatus(200);
	// } else {
	// 	console.log("Error sending notification");
	// 	res.sendStatus(500);
	// }
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
					io.emit('link-expired', {id: response._id})
				})
			}, linkDuration)
			io.emit('link-created', {link: {...response._doc, revision: req.body.revision}})
		})
	} else {
		// No coordinates found
		console.error("No coordinates found or supplied, exiting.")
	}
})

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
		io.emit('geolocation-updated', {user: req.user, geolocation: payload});
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
		},
		bannedUsers: {
			$ne: req.user._id
		}
	})
	.then(rooms => {
		res.json(rooms);
	})
});

router.get('/api/chat/room/fetch-joined', authorizeUser, async function(req,res) {
	var rooms = Room.find({members: {$elemMatch: {user:req.user._id}}, hiddenBy: {$ne: req.user._id},bannedUsers: {$ne: req.user._id}})
	.populate('members.user')
	.populate('bannedUsers')
	.sort('name')
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
	.populate('bannedUsers')
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
		User.findOneAndUpdate({_id: req.user._id}, { $set: {'memory.lastRoom': room.slug}}, {new: true})
		.then((user) => {
			if (roomType === "direct-message") {
				if (user.socketID) {
					io.emit('direct-message-room-created', {room: room, sender: req.user, recipient: req.body.recipient})
				}
			} else {
				io.emit('room-created',  {room: room, user: req.user})
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
				// Don't spam the socket with private room edits
				// DEBUG: DOESN'T WORK
				if (room.public) {
					io.emit('room-edited', room)
				} else {
					io.in(roomSlug).emit('room-edited', room)
				}
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
		User.update({_id: req.user._id}, { $set: {'memory.lastRoom': req.params.room}})
		.then(response => {
			// Check if this user is a member or just visiting
			if (room.members.some(m => m.user.equals(req.user._id))) {
				res.sendStatus(200);
			} else {
				// Check if user is already in the visitors array
				if (!room.visitors.some(v => v.equals(req.user._id))) {
					room.visitors.push(req.user._id)
					room.save()
					.then(room => {
						io.in(room.slug).emit('visitor-entered-room', {room: room, user: req.user})
						res.sendStatus(200);
					})
				} else {
					console.log(req.user.username + " is already a visitor in this room")
					// But do it again just in case I guess
					io.in(room.slug).emit('visitor-entered-room', {room: room, user: req.user})
					res.sendStatus(200);
				}
			}
		})
	});
});

router.post('/api/chat/room/exit/:room', authorizeUser, function(req,res) {
	Room.findOne({
		slug: req.params.room
	})
	.then(room => {
		// Check if this user is a member or just visiting
		if (room.members.some(m => m.user.equals(req.user._id))) {
			res.sendStatus(200);
		} else {
			// Check if user is in the visitors array
			if (room.visitors.some(v => v.equals(req.user._id))) {
				room.visitors = room.visitors.filter(v => !v.equals(req.user._id))
				room.save()
				.then(room => {
					io.in(room.slug).emit('visitor-exited-room', {room: room, user: req.user})
					res.sendStatus(200);
				})
			} else {
				console.log(req.user.username + " wasn't a visitor in this room (apparently)");
				// But remove them anyway...?
				io.in(room.slug).emit('visitor-exited-room', {room: room, user: req.user})
				res.sendStatus(200);
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
			room.members.push({user: req.user._id, role: (room.members.length === 0 ? 'administrator' : 'member')});
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
					io.in(room.slug).emit('user-joined-room', {room: room, user: req.user, message: message})
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
				io.in(room.slug).emit('user-left-room', {room: room, user: req.user, message: message})
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
					io.emit('user-invited-to-room', {room: room, user: user})
					res.sendStatus(200);
				})
			}
		}
	})
});

router.post('/api/chat/room/ban/:room/:userID', authorizeUser, function(req,res) {
	console.log("Banning",req.params.userID,"from",req.params.room)
	Room.findOne({
		slug: req.params.room
	})
	.then(async (room) => {
		let user = await User.findById(req.params.userID)
		if (user) {
			// Remove user from members and visitors arrays
			if (room.members.some(v => v.user.equals(req.params.userID))) {
				room.members = room.members.filter(v => !v.user.equals(req.params.userID));
			}
			if (room.visitors.some(v => v.equals(req.params.userID))) {
				room.visitors = room.visitors.filter(v => !v.equals(req.params.userID));
			}
			// Add user to banned users array
			if (!room.bannedUsers.some(b => b.equals(req.params.userID))) {
				room.bannedUsers.push(req.params.userID);
			}
			room.save()
			.then(result => {
				user.memory.lastRoom = 'global-coven';
				user.save()
				.then(result => {
					io.emit('user-banned-from-room', {room: room, user: user})
					res.sendStatus(200);
				})
			})
		}
	})
});

router.post('/api/chat/room/unban/:room/:userID', authorizeUser, function(req,res) {
	console.log("Unbanning",req.params.userID,"in",req.params.room)
	Room.findOne({
		slug: req.params.room
	})
	.then(async (room) => {
		let user = await User.findById(req.params.userID)
		if (user) {
			// Remove user from banned users array
			if (room.bannedUsers.some(v => v.equals(req.params.userID))) {
				room.bannedUsers = room.bannedUsers.filter(v => !v.equals(req.params.userID));
			}
			room.save()
			.then(result => {
				io.emit('user-unbanned-from-room', {room: room, user: user})
				res.sendStatus(200);
			})
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
