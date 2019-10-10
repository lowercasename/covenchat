const mongoose = require('mongoose');

var postSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    timestamp: {type: Date, default: new Date()},
    title: String,
    content: String,
    category: String,
    public: {type: Boolean, default: false},
});

module.exports = mongoose.model('Post', postSchema);
