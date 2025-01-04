const { autoPointsSchema } = require("../../models/autoPoints.js");
const autoPoints = require("../../utils/autoPoints.js");

module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {

        async function checkAutoStatistics(guild, allAutoStatistics) {
            
            const guildAutoStatistics = allAutoStatistics.find(stats => stats.guildId === guild.id);
            if (!guildAutoStatistics) return;

            const topPointsChannel = guild.channels.cache.get(guildAutoStatistics.topPointsChannelId);

            const refreshTime = Date.now() + 1000 * 60 * 5;

            if (guildAutoStatistics.topPointsChannelId !== "0" /*&& Date.now() > guildAutoStatistics.topChatRefresh*/) {
                autoPoints.updateWeeklyPredictionStatistics(guild, topPointsChannel, guildAutoStatistics.topWeeklyPointsMessageId);
                await autoPointsSchema.updateOne({ guildId: guild.id, topPointsRefresh: refreshTime });
            }
        }

        const statisticsCheck = async () => {
            const guilds = Array.from(client.guilds.cache.values());
            const allAutoStatistics = await autoPointsSchema.find();

            for (const guild of guilds) {
                checkAutoStatistics(guild, allAutoStatistics);
            }
        }

        statisticsCheck();
        const newInterval = setInterval(statisticsCheck, 1000 * 60);
        client.readyIntervals.push(newInterval)

    }
}