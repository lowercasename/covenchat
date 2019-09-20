require('dotenv').config();

const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const app = express();

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

// DATABASE
mongoose.connect('mongodb://localhost/covenchat', {useNewUrlParser: true, useUnifiedTopology: true});
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log("Connected to MongoDB!")
});
Geolocation = require('./models/geolocation');
Message = require('./models/message');
Room = require('./models/room');

// ROUTER
const router = require('./router');
app.use(router);

// var globalCoven = new Room({
//   name: 'Global Coven',
//   description: '🌙🔮 All are welcome and none are refused entry to the Global Coven! 🔮🌙',
//   lastUpdated: new Date(),
//   public: true
// })

// globalCoven.save().then(result => console.log(result))

// SERVER
const port = process.env.PORT;
app.listen(port, () => console.log('🔮 Covenchat running on port ' + port + '!'))