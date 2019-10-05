require('dotenv').config();

const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
if (process.env.NODE_ENV != "production") var morgan = require('morgan')
const app = express();
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');

if (process.env.NODE_ENV != "production") app.use(morgan('tiny'));

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.use(cookieParser());

app.use(cors());


// DATABASE
const configDatabase = require('./database.js');
mongoose.connect(configDatabase.url, {useNewUrlParser: true, useUnifiedTopology: true});
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log("Connected to MongoDB!")
});
Geolocation = require('./database/geolocation');
Message = require('./database/message');
Room = require('./database/room');
User = require('./database/user');
Altar = require('./database/altar');

// ROUTER
const router = require('./router');
app.use(router);

// var globalCoven = new Room({
//   name: 'Global Coven',
//   slug: 'global-coven',
//   description: '🌙🔮 All are welcome and none are refused entry to the Global Coven! 🔮🌙',
//   lastUpdated: new Date(),
//   public: true
// })

// globalCoven.save().then(result => console.log(result))

// SERVER
const port = process.env.PORT;
app.listen(port, () => console.log('🔮 Covenchat running on port ' + port + '!'))
