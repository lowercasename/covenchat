const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

var geolocationSchema = new mongoose.Schema({
  latitude: Number,
  longitude: Number,
  expiry: Date
})

var notificationSchema = new mongoose.Schema({
  type: String,
  text: String,
  buttonText: String,
  sender: String
})

var userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  lastOnline: { type: Date, default: new Date() },
  geolocation: geolocationSchema,
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  memory: {
    lastRoom: { type: String, default: 'global-coven' }
  },
  notifications: [notificationSchema],
  settings: {
    status: { type: String, default: 'available' },
    flair: String,
    shareLocation: {type: Boolean, default: true},
    statusBarModules: {
        moonPhase: {
          slug: {type: String, default: 'moonPhase'},
          prettyName: {type: String, default: 'Moon phase'},
          set: {type: Boolean, default: true}
        },
        wheelOfTheYear: {
          slug: {type: String, default: 'wheelOfTheYear'},
          prettyName: {type: String, default: 'Wheel of the Year'},
          set: {type: Boolean, default: true}

        },
        astrologicalSeason: {
          slug: {type: String, default: 'astrologicalSeason'},
          prettyName: {type: String, default: 'Astrological season'},
          set: {type: Boolean, default: true}

        },
        mercuryRetrograde: {
          slug: {type: String, default: 'mercuryRetrograde'},
          prettyName: {type: String, default: 'Mercury retrograde status'},
          set: {type: Boolean, default: true}
        }
    },
    displayName: String
  }
});

userSchema.methods.isCorrectPassword = function (password, callback) {
  bcrypt.compare(password, this.password, function (err, same) {
    if (err) {
      callback(err);
    } else {
      callback(err, same);
    }
  });
}

userSchema.pre('save', function (next) {
  // Check if document is new or a new password has been set
  if (this.isNew || this.isModified('password')) {
    // Saving reference to this because of changing scopes
    const document = this;
    bcrypt.hash(document.password, 10,
      function (err, hashedPassword) {
        if (err) {
          next(err);
        }
        else {
          document.password = hashedPassword;
          next();
        }
      });
  } else {
    next();
  }
});

module.exports = mongoose.model('User', userSchema);
