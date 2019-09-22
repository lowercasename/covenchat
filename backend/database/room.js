const mongoose = require('mongoose');

var roomSchema = new mongoose.Schema({
    name: String,
    description: String,
    welcomeMessage: String,
    lastUpdated: {type: Date, default: new Date()},
    public: {type: Boolean, default: true},
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User'}],
    administrators: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User'}],
    moderators: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User'}]
});

module.exports = mongoose.model('Room', roomSchema);
