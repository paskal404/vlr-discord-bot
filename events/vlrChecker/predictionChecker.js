const { eventSchema } = require("../../models/Event");
const { predictionSchema } = require("../../models/Prediction");
const axios = require('axios');

module.exports = {
    name: 'ready',
    once: true,
    execute(client) {
        async function checkServer(guild) {
            const events = await eventSchema.find({ guildId: guild.id });
            const predictions = await predictionSchema.find({ guildId: guild.id, checked: false });

            for (const predictionDoc of predictions) {

                const event = events.find((event) => event.eventId === predictionDoc.eventId)
                if (!event) break;

                const match = event.matches.find((match) => predictionDoc.matchTitle === `${match.team_one_name} vs. ${match.team_two_name}` && match.status === "final");
                if (!match) break;

                let points = 0;

                //That shit works, dont touch please XD
                const predictedScore = `${predictionDoc.matchScore.firstScore}:${predictionDoc.matchScore.secondScore}`;
                const actualScore = `${match.team_one_score}:${match.team_two_score}`

                if (predictedScore === actualScore) {
                    points++;
                }

                for (let i = 0; i < match.mapLinks.length; i++){
                    const prediction = predictionDoc.mapScores[i];
                    if (!prediction) break;

                    const mapMatch = match.mapLinks[i];
                    if (!mapMatch) break;

                    const predictedMapScore = `${prediction.firstScore}:${prediction.secondScore}`;
                    const actualMapScore = `${mapMatch.team_one_map_score}:${mapMatch.team_two_map_score}`;

                    if (predictedMapScore === actualMapScore) {
                        points++;
                    }
                }

                console.log(points)
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