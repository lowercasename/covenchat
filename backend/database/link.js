const mongoose = require('mongoose');

var linkSchema = new mongoose.Schema({
    fromCoordinates: [Number, Number],
    toCoordinates: [Number, Number],
    fromUsername: String,
    toUsername: String,
    expiryTime: Date
});

module.exports = mongoose.model('Link', linkSchema);
