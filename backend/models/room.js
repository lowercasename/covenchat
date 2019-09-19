const mongoose = require('mongoose');

var roomSchema = new mongoose.Schema({
    name: String,
    lastUpdated: {type: Date, default: new Date()},
    public: {type: Boolean, default: true},
    // members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User'}]
    members: [],
});

module.exports = mongoose.model('Message', messageSchema);