const mongoose = require('mongoose');

const predictionSchema = new mongoose.Schema({
    guildId: { type: String, required: true },
    userId: { type: String, required: true },
    eventId: { type: String, required: true },
    matchTitle: { type: String, required: true },

	matchId: { type: String, required: true },

    points: { type: Number, default: 0, required: true },
    matchScore: {
        firstScore: {
            type: String, required: true,
        },
        secondScore: {
            type: String, required: true,
        },
    },
    mapScores: { type: Array, default: [], required: true },
    allMapsGuessed: {
        type: Boolean,
        required: false,
    },
    checked: { type: Boolean, required: true, default: false },

    predictedOutcome: {
        type: String,
        enum: ['firstTeamWin', 'draw', 'secondTeamWin'], // restricts the possible values
        required: true,
    },
    predictedOutcomeGuessed: {
        type: String,
        enum: ['false', 'onlyWinnerTeam', 'wholeScore'],
        required: false,
    },

    topFragger: {
        type: String,
        required: false,
    },
    topFraggerGuessed: {
        type: Boolean,
        required: false,
    },

    createdAt: { type: String, required: true },
    checkedAt: { type: String },
});

module.exports.predictionSchema = mongoose.model('Prediction', predictionSchema);
