const utils = require("../../utils/guild")

module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {

        const initGuilds = async () => {
            const guilds = Array.from(client.guilds.cache.values());

            for (const guild of guilds) {
                await utils.getGuildSettings(client, guild.id);
            }
        }

        initGuilds();
        const newInterval = setInterval(initGuilds, 1000 * 60);
        client.readyIntervals.push(newInterval)

    }
}