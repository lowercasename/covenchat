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
  resetPasswordToken: { type: String },
  resetPasswordTokenExpiry: { type: Date },
  lastOnline: { type: Date, default: new Date() },
  geolocation: geolocationSchema,
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  memory: {
    lastRoom: { type: String, default: 'global-coven' }
  },
  notifications: [notificationSchema],
  webpushSubscription: String,
  webpushPermissionRequested: {type: Boolean, default: false},
  geolocationPermissionRequested: {type: Boolean, default: false},
  socketID: { type: String },
  settings: {
    status: { type: String, default: 'available' },
    flair: String,
    shareLocation: {type: Boolean, default: true},
    allowNotifications: {type: Boolean, default: true},
    statusBarModules: {
        moonPhase: {
          slug: {type: String, default: 'moonPhase'},
          prettyName: {type: String, default: 'Moon phase'},
          set: {type: Boolean, default: true}
        },
        wheelOfTheYearNorthern: {
          slug: {type: String, default: 'wheelOfTheYearNorthern'},
          prettyName: {type: String, default: 'Wheel of the Year (Northern hemisphere)'},
          set: {type: Boolean, default: true}
        },
        wheelOfTheYearSouthern: {
          slug: {type: String, default: 'wheelOfTheYearSouthern'},
          prettyName: {type: String, default: 'Wheel of the Year (Southern hemisphere)'},
          set: {type: Boolean, default: false}
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
