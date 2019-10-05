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

async function addSettings() {
    User.update({},{'settings.statusBarModules':{moonPhase: {
        slug: 'moonPhase',
        prettyName: 'Moon phase',
        set: true
      },
      wheelOfTheYear: {
        slug: 'wheelOfTheYear',
        prettyName: 'Wheel of the Year',
        set: true

      },
      astrologicalSeason: {
        slug: 'astrologicalSeason',
        prettyName: 'Astrological season',
        set: true

      },
      mercuryRetrograde: {
        slug: 'mercuryRetrograde',
        prettyName: 'Mercury retrograde status',
        set: true
      }}},{multi:true})
    .then(res => {
        console.log(res);
        process.exit()
    })
}

addSettings();