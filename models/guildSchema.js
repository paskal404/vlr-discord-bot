const mongoose = require('mongoose')

const guildSchema = new mongoose.Schema({
    guildId: { type: String, required: true, unique: true },
    prefix: { type: String, default: '!' },
    access: { type: String, default: 'everyone' },
});


module.exports = mongoose.model('guild', guildSchema);