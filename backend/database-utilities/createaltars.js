require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');

// DATABASE
const configDatabase = require('../database.js');
mongoose.connect(configDatabase.url, {useNewUrlParser: true, useUnifiedTopology: true});
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log("Connected to MongoDB!")
});

User = require('../database/user');
Altar = require('../database/altar');

async function createAltars() {
    var allUsers = await User.find();

    var userIDs = allUsers.map(u => u._id);

    userIDs.forEach(id => {
        var defaultAltar = new Altar({
            user: id,
            cells: [{type: 'empty', contents: ''},{type: 'text', contents: 'As above, so below'},{type: 'empty', contents: ''},{type: 'empty', contents: ''},{type: 'image', contents: 'hermetica-F032-pentacle'},{type: 'empty', contents: ''},{type: 'empty', contents: ''},{type: 'empty', contents: ''},{type: 'empty', contents: ''}]
        })
        defaultAltar.save()
        .then(res => {
            console.log(res);
        })
    })
}
createAltars();
