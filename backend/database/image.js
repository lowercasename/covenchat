const mongoose = require('mongoose');

var imageSchema = new mongoose.Schema({
    filename: String,
    uploader: { type: mongoose.Schema.Types.ObjectId, ref: 'User'}
});

module.exports = mongoose.model('Image', imageSchema);
