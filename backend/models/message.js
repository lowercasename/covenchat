const mongoose = require('mongoose');

var messageSchema = new mongoose.Schema({
    userID: String,
    timestamp: {type: Date, default: new Date()},
    type: String,
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room'},
    content: String
});

module.exports = mongoose.model('Message', messageSchema);