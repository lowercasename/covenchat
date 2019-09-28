const express = require('express');
const router = express.Router();
const passport = require('passport');
const Pusher = require('pusher');
const parser = require('./parser');
const jwt = require('jsonwebtoken');
const secret = process.env.SECRET;
const authorizeUser = require('./authorizer');

// WEBSOCKETS
const pusher = new Pusher({
	appId: '864592',
	key: '7155c345db324b8f1ba5',
	secret: '53db929c783b5ee700ee',
	cluster: 'eu',
	useTLS: true
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
						expiresIn: '1d'
					});
					res.cookie('token', token, { httpOnly: true })
					.status(200)
					.json({success: true})
				}
			});
		}
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
					res.status(200)
					.json({success: true})
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

router.post('/pusher/auth', function(req, res) {
	var socketId = req.body.socket_id;
	var channel = req.body.channel_name;
	var auth = pusher.authenticate(socketId, channel);
	res.send(auth);
});

router.post('/api/geolocation/update', function(req,res) {
	var payload = {
		longitude: req.body.position.longitude,
		latitude: req.body.position.latitude,
		userID: req.body.userID,
		state: req.body.state
	}
	var geolocation = Geolocation.findOneAndUpdate(
		{
			userID: req.body.userID
		},
		payload,
		{
			upsert: true,
			new: true
		}
	)
	.then(response => {
		if (req.body.state === "online"){
			pusher.trigger('geolocations', 'geolocation-updated', payload, req.body.socketId)
		}
	})
});

router.post('/api/chat/message/new', authorizeUser, async function(req,res) {
	var parsedMessage = parser(req.body.content);
	if (!parsedMessage.isValid)
	return false;
	var message = new Message({
		user: req.body.userID,
		timestamp: new Date(),
		type: parsedMessage.type,
		room: req.body.room,
		content: parsedMessage.content,
		tarot: parsedMessage.tarot,
		runes: parsedMessage.runes
	});
	message.save()
	.then(message => {
		var savedMessage = Message.findById(message._id)
		.populate('user')
		.then(retrievedMessage => {
			pusher.trigger('messages', 'message-sent', retrievedMessage, req.body.socketId)
		})
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

router.get('/api/chat/room/fetch-joined', authorizeUser, function(req,res) {
	var rooms = Room.find({members: {$elemMatch: {user:req.user._id}}}).sort('name')
	.then(rooms => {
		res.json(rooms);
	})
});

router.get('/api/chat/room/fetch/:room', authorizeUser, async function(req,res) {
	let room = await Room.findOne({
		slug: req.params.room
	})
	.populate('members.user')
	.populate('visitors');
	let messages = await Message.find({
		room: room._id
	})
	.populate('user');
	res.status(200)
	.json({
		messages: messages,
		room: room
	});
});

router.post('/api/chat/room/create', authorizeUser, function(req,res) {
	const { roomSlug, roomName, roomDescription, roomPrivacy } = req.body;
	var room = new Room({
		slug: roomSlug,
		name: roomName,
		description: roomDescription,
		public: (roomPrivacy == 'public' ? true : false),
		members: [{user: req.user._id, role: 'administrator'}]
	})
	room.save()
	.then(room => {
		User.update({_id: req.user._id}, {'memory.lastRoom': roomSlug})
		.then(response => {
			pusher.trigger('general', 'room-created', room);
			res.sendStatus(200);
		})
	})
});

router.post('/api/chat/room/enter/:room', authorizeUser, function(req,res) {
	Room.findOne({
		slug: req.params.room
	})
	.then(room => {
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
					User.update({_id: req.user._id}, {'memory.lastRoom': room.slug})
					.then(response => {
						pusher.trigger('general', 'visitor-entered-room', {room: room, user: req.user}, req.body.socketId);
						res.sendStatus(200);
					});
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
			// Add user to members array
			room.members.push({user: req.user._id, role: 'member'});
			room.save()
			.then(room => {
				var message = new Message({
					user: req.user._id,
                    timestamp: new Date(),
                    type: 'alert',
                    room: room._id,
                    content: 'has joined ' + room.name,
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
			// Add user to visitors array
			room.visitors.push(req.user._id);
		}
		room.save()
		.then(room => {
			var message = new Message({
				user: req.user._id,
				timestamp: new Date(),
				type: 'alert',
				room: room._id,
				content: 'has left ' + room.name,
			})
			message.save()
			.then(response => {
				pusher.trigger('general', 'user-left-room', {room: room, user: req.user}, req.body.socketId);
				res.sendStatus(200);
			})
		});
	});
});

module.exports = router;
