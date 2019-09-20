const express = require('express');
const router = express.Router();
const Pusher = require('pusher');

// WEBSOCKETS
const pusher = new Pusher({
	appId: '864592',
	key: '7155c345db324b8f1ba5',
	secret: '53db929c783b5ee700ee',
	cluster: 'eu',
	useTLS: true
});

router.get('/api/users', function(req, res, next) {
	res.json([{
		id: 1,
		username: "Acid Burn"
	}, {
		id: 2,
		username: "Crash Override"
	}]);
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

router.post('/api/chat/message/new', function(req,res) {
	if (req.body.content.startsWith('/me ')) {
		var messageType = 'action'
		var messageContent = req.body.content.replace('/me ','');
	} else {
		var messageType = 'message';
		var messageContent = req.body.content;
	}

	var message = new Message({
		userID: req.body.userID,
		timestamp: new Date(),
		type: messageType,
		room: req.body.room,
		content: messageContent
	})
	message.save()
	.then(message => {
		pusher.trigger('messages', 'message-sent', message, req.body.socketId)
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
	.then(messages => {
		console.log(messages)
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

module.exports = router;