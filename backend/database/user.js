const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

var geolocationSchema = new mongoose.Schema({
    latitude: Number,
    longitude: Number
})

var userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    lastOnline: {type: Date, default: new Date()},
    status: { type: String, default: 'active' },
    geolocation: geolocationSchema,
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User'}],
    memory: {
        lastRoom: { type: String, default: 'global-coven' }
    }
});

userSchema.methods.isCorrectPassword = function(password, callback){
  bcrypt.compare(password, this.password, function(err, same) {
    if (err) {
      callback(err);
    } else {
      callback(err, same);
    }
  });
}

userSchema.pre('save', function(next) {
  // Check if document is new or a new password has been set
  if (this.isNew || this.isModified('password')) {
    // Saving reference to this because of changing scopes
    const document = this;
    bcrypt.hash(document.password, 10,
      function(err, hashedPassword) {
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
