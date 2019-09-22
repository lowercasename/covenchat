const mongoose = require('mongoose');

var tarotSchema = new mongoose.Schema({
    slug: String,
    name: String,
    image: String
})

var runeSchema = new mongoose.Schema({
    slug: String,
    name: String,
    image: String
})

var messageSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    timestamp: {type: Date, default: new Date()},
    type: String,
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room'},
    content: String,
    tarot: [tarotSchema],
    runes: [runeSchema]
});

module.exports = mongoose.model('Message', messageSchema);
