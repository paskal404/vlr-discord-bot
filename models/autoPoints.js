const mongoose = require("mongoose");

const reqString = {
    type: String,
    default: "0",
    required: true,
}

const autoPointsSchema = new mongoose.Schema({
    guildId: reqString,

    topPointsChannelId: reqString,
    topPointsRefresh: reqString,

    topWeeklyPointsMessageId: reqString,
    topWeeklyPointsRewardTimestamp: reqString,

	topAllTimePointsMessageId: reqString,
});

module.exports.autoPointsSchema = mongoose.model("autoPoints", autoPointsSchema)