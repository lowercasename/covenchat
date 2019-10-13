const express = require('express');
const tarotCards = require('./data/tarot.json');
const runes = require('./data/runes.json');
const linkify = require('linkifyjs');
const linkifyStr = require('linkifyjs/string');
require('linkifyjs/plugins/mention')(linkify);


function drawTarot(number = 1) {
    let tarotArray = [];
    for (i = 0; i < number; i++){
        let card = tarotCards.deck[Math.floor(Math.random()*tarotCards.deck.length)];
        // Redraw if card has already been drawn
        if (tarotArray.some(e => (e.slug === card.slug))) {
            i--;
            continue;
        }
        console.log(card)
        tarotArray.push(card);
    }
    return tarotArray;
}

function castRunes(number = 1) {
    let runesArray = [];
    for (i = 0; i < number; i++){
        let rune = runes.elderFuthark[Math.floor(Math.random()*runes.elderFuthark.length)];
        // Redraw if rune has already been cast
        if (runesArray.some(e => (e.slug === rune.slug))) {
            i--;
            continue;
        }
        runesArray.push(rune);
    }
    console.log(runesArray)
    return runesArray;
}

function parseMessage(text) {
    text = text.trim();
    let messageType, messageContent, messageTarot, messageRunes, mentions = [];
    let messageIsValid = true;
    if (text.startsWith('/me ')) {
        messageType = 'action';
        messageContent = text.replace('/me ','');
    } else if (text.startsWith('/tarot ') || text === '/tarot') {
        let number = Math.floor(text.split(' ')[1]);
        if (!number) number = 1;
        if (number > 9) number = 9;
        messageTarot = drawTarot(number);
        messageType = 'tarot';
        messageContent = 'draws ' + (number > 1 ? number + ' Tarot cards' : 'a Tarot card') + '.';
    } else if (text.startsWith('/runes ') || text === '/runes') {
        console.log("Rune!");
        let number = Math.floor(text.split(' ')[1]);
        if (!number) number = 1;
        if (number > 9) number = 9;
        messageRunes = castRunes(number);
        messageType = 'runes';
        messageContent = 'casts ' + (number > 1 ? number + ' runes' : 'a rune') + '.';
    } else {
        messageType = 'message';
        messageContent = text.linkify({
            formatHref: {
                mention: function (href) {
                    mentions.push(href.slice(1))
                    return '/altar' + href;
                },
            }
        });
    }
    var payload = {
        isValid: messageIsValid,
        type: messageType,
        content: messageContent,
        tarot: messageTarot,
        runes: messageRunes,
        mentions: mentions
    }
    return payload;
}

module.exports = parseMessage;
