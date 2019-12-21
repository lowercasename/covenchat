const mongoose = require('mongoose');

var roomMemberSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    role: { type: String, default: 'member'},
    showWelcomeMessage: { type:  Boolean, default: true }
})

var roomSchema = new mongoose.Schema({
    type: {type: String, default: 'room'},
    slug: {type: String, unique: true},
    name: {type: String},
    description: String,
    welcomeMessage: {type: String, default: ''},
    lastUpdated: {type: Date, default: new Date()},
    public: {type: Boolean, default: true},
    members: [roomMemberSchema],
    visitors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User'}],
    bannedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User'}],
    hiddenBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User'}]
});

module.exports = mongoose.model('Room', roomSchema);
