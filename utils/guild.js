const guildSchema = require("../models/guildSchema");

module.exports.getGuildSettings = async (client, guildId) => {
    const guildSettings = await guildSchema.findOne({ guildId: guildId });

    if (!guildSettings) {
        const newGuildSettings = new guildSchema({
            guildId: guildId,
            prefix: "!",
            access: "everyone",
        });

        await newGuildSettings.save();
        return newGuildSettings;
    }

    return guildSettings;
}