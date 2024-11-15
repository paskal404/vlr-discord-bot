// models/Event.js
const mongoose = require('mongoose');

const predictionSchema = new mongoose.Schema({
    guildId: { type: String, required: true },
    userId: { type: String, required: true },
    eventId: { type: String, required: true },
    matchTitle: { type: String, required: true },
    points: { type: Number, default: 0, required: true },
    matchScore: {
        firstScore: {
            type: String, required: true,
        },
        secondScore: {
            type: String, required: true,
        },
    },
    // map1Score: {
    //     firstScore: {
    //         type: String,
    //     },
    //     secondScore: {
    //         type: String,
    //     },
    // },
    // map2Score: {
    //     firstScore: {
    //         type: String,
    //     },
    //     secondScore: {
    //         type: String,
    //     },
    // },
    // map3Score: {
    //     firstScore: {
    //         type: String,
    //     },
    //     secondScore: {
    //         type: String,
    //     },
    // },
    mapScores: { type: Array, default: [], required: true },
    checked: { type: Boolean, required: true, default: false },

});

module.exports.predictionSchema = mongoose.model('Prediction', predictionSchema);
