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
    eventId: { type: String, required: true, unique: true }, // ID wydarzenia
    name: { type: String, required: true }, // Nazwa wydarzenia
    url: { type: String, required: true }, // Link do wydarzenia
    matchesUrl: { type: String, required: true },
    bracketContainers: [bracketContainerSchema]
});

module.exports.eventSchema = mongoose.model('Event', eventSchema);
