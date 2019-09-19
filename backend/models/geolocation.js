const mongoose = require('mongoose');

var geolocationSchema = new mongoose.Schema({
    userID: String,
    state: String,
    longitude: Number,
    latitude: Number,
});

module.exports = mongoose.model('Geolocation', geolocationSchema);