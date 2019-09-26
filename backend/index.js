require('dotenv').config();

const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
if (process.env.NODE_ENV != "production") var morgan = require('morgan')
const app = express();
const passport = require('passport');
const bcrypt = require('bcrypt');
const LocalStrategy = require('passport-local').Strategy;
const cookieParser = require('cookie-parser');

if (process.env.NODE_ENV != "production") app.use(morgan('tiny'));

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

// app.use(require('express-session')({ secret: 'spoopy skellingtons', resave: false, saveUninitialized: false }));
app.use(cookieParser());

// AUTHENTICATION

passport.use(new LocalStrategy(
    function(username, password, done) {
        User.findOne({ username: username }, function (err, user) {
            if (err) { return done(err); }
            if (!user) { return done(null, false, { message: 'Incorrect username.' }); }
            bcrypt.compare(password, user.password, function(err, res) {
                if(res) {
                    return done(null, user);
                } else {
                    return done(null, false, { message: 'Incorrect password.' });
                }
            });
        });
    }
));

passport.serializeUser(function(user, done) {
  done(null, user._id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function (err, user) {
    if (err) { return done(err); }
    done(null, user);
  });
});

app.use(passport.initialize());
app.use(passport.session());

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
