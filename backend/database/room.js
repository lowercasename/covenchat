const mongoose = require('mongoose');

var roomMemberSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    role: { type: String, default: 'member'}
})

var roomSchema = new mongoose.Schema({
    name: {type: String, unique: true},
    description: String,
    welcomeMessage: String,
    lastUpdated: {type: Date, default: new Date()},
    public: {type: Boolean, default: true},
    members: [roomMemberSchema]
});

module.exports = mongoose.model('Room', roomSchema);
