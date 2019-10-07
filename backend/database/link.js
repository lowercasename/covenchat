const mongoose = require('mongoose');

var linkSchema = new mongoose.Schema({
    fromCoordinates: [String, String],
    toCoordinates: [String, String],
    fromUsername: String,
    toUsername: String,
    expiryTime: Number
});

module.exports = mongoose.model('Link', linkSchema);
