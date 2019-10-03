const mongoose = require('mongoose');

var cellSchema = new mongoose.Schema({
    type: { type: String, default: 'empty' },
    contents: String,
    color: {
        r: {type: String, default: '255'},
        g: {type: String, default: '255'},
        b: {type: String, default: '255'},
        a: {type: String, default: '0.5'},
    }
})

var candleSchema = new mongoose.Schema({
    color: String,
    duration: Number,
    expiryTime: Number
})

var altarSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    cells: [cellSchema],
    candles: [candleSchema],
    backgroundColor: {
        r: {type: String, default: '62'},
        g: {type: String, default: '41'},
        b: {type: String, default: '72'},
        a: {type: String, default: '1'}
    }
});

module.exports = mongoose.model('Altar', altarSchema);
