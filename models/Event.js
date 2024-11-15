// models/Event.js
const mongoose = require('mongoose');

const bracketContainerSchema = new mongoose.Schema({
    containerIndex: { type: Number, required: true },
    matches: {
        type: Array,
    },
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' }  // Odwołanie do eventu
});

module.exports.bracketSchema = mongoose.model('Bracket', bracketContainerSchema);

const eventSchema = new mongoose.Schema({
    guildId: { type: String, required: true },
    eventId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    url: { type: String, required: true },
    matchesUrl: { type: String, required: true },
    matches: { type: Array, default: [], required: true },
    status: { type: String, required: true, },
    bracketContainers: [bracketContainerSchema]
});

module.exports.eventSchema = mongoose.model('Event', eventSchema);
