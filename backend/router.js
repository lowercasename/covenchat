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

// router.get('/api/user/verify', function(req, res) {
// 	console.log("Verifying user!");
// 	console.log(req.user)
// 	if(req.user) {
// 		return res.status(200).json({
// 			user: req.user,
// 			isAuthenticated: true
// 		});
// 	} else {
// 		return res.status(401).json({
// 			error: 'User is not authenticated',
// 			isAuthenticated: false
// 		});
// 	}
// });

router.post('/api/user/authenticate', function(req, res) {
	console.log("Authenticating user!");
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
					console.log("Creating cookie!")
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
	res.json({
		user: req.user
	});
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
			console.log("Successfully registered!")
			res.status(200)
			.json({success: true})
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
		console.log(payload)
		if (req.body.state === "online"){
			pusher.trigger('geolocations', 'geolocation-updated', payload, req.body.socketId)
		}
	})
});

router.post('/api/chat/message/new', async function(req,res) {
	console.log("Saving message: ",req.body.content)
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

router.get('/api/chat/room/fetch-all', function(req,res) {
	var rooms = Room.find()
	.then(rooms => {
		res.json(rooms);
	})
});

router.get('/api/chat/room/fetch/:room', function(req,res) {
	var messages = Message.find({
		room: req.params.room
	})
	.populate('user')
	.then(messages => {
		res.json(messages);
	})
});

router.post('/api/chat/room/create', function(req,res) {
	var room = new Room({
		name: req.body.name,
		lastUpdated: new Date(),
		public: (req.body.public == true ? true : false)
	})
	room.save()
	.then(room => {
		pusher.trigger('rooms', 'room-created', message, req.body.socketId)
	})
});

router.get('/*', function(req,res) {
	res.sendFile(path.join(__dirname, '/var/www/coven.chat/index.html'), function(err) {
    if (err) {
      res.status(500).send(err);
    }
  })
})

module.exports = router;
