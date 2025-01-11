const { eventSchema } = require("../../models/Event");
const axios = require('axios');

module.exports = {
    name: 'ready',
    once: true,
    execute(client) {
        async function checkServer(guild) {
            const events = await eventSchema.find({ guildId: guild.id }).lean();

            for (const event of events) {

                let fetchedMatches = [];

                const response1 = await axios.get(`${process.env.VLR_SCRAPPER_API}/matches/all?url=${event.matchesUrl}`);
                const eventMatches = response1.data;

                for (const match of eventMatches) {
                    // if (match.status === "Completed") continue;

                    const response2 = await axios.get(`${process.env.VLR_SCRAPPER_API}/match?url=${match.match_url}/?game=all&tab=overview`);
                    const matchInfo = response2.data;

                    // for (let i = 0; i < matchInfo.mapLinks.length; i++) {
                    //     const mapLink = matchInfo.mapLinks[i];
                    //     // console.log(mapLink)
                    //     if (!mapLink) continue;

                    //     const response3 = await axios.get(`${process.env.VLR_SCRAPPER_API}/matchMap?url=${match.match_url}/?game=${mapLink.mapGameId}`);
                    //     const mapInfo = response3.data;

                    //     matchInfo.mapLinks[i] = { ...matchInfo.mapLinks[i], ...mapInfo };
                    // }

					// console.log(matchInfo.mapLinks)

                    fetchedMatches.push(matchInfo)
                }

                const bracket = await axios.get(`${process.env.VLR_SCRAPPER_API}/bracket?url=${event.url}`);
                const bracketData = bracket.data;

                await eventSchema.updateOne({ guildId: guild.id, eventId: event.eventId }, { status: "checked", matches: fetchedMatches, bracketContainers: bracketData, });
            }
        }

        async function checkServers() {
            const guilds = Array.from(client.guilds.cache.values());

            for (const guild of guilds) {
                await checkServer(guild);
            }
        }

        checkServers();
        const newInterval = setInterval(checkServers, 1000 * 60);
        client.readyIntervals.push(newInterval);

    },
};