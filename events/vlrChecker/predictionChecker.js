const { eventSchema } = require("../../models/Event");
const { predictionSchema } = require("../../models/Prediction");
const axios = require('axios');

module.exports = {
    name: 'ready',
    once: true,
    execute(client) {
        async function checkServer(guild) {
            const events = await eventSchema.find({ guildId: guild.id });
            let predictions = await predictionSchema.find({ guildId: guild.id, checked: false });

            for (let predictionDoc of predictions) {

                const event = events.find((ev) => ev.eventId === predictionDoc.eventId || ev.name === predictionDoc.eventId)
                if (!event) {
                    continue;
                }

                const match = event.matches.find((match) => predictionDoc.matchId === match.matchId && match.status === "final");
                if (!match) {
                    continue;
                }   

                let points = 0;

                let topFraggerGuessed = false;
                let predictedOutcomeGuessed = "false";

                const predictedScore = `${predictionDoc.matchScore.firstScore}:${predictionDoc.matchScore.secondScore}`;
                const actualScore = `${match.team_one_score}:${match.team_two_score}`

                const players = match.team_one_players.concat(match.team_two_players);
                const topFragger = players.sort((a, b) => b.kills - a.kills)[0];

                const topFraggers = players.filter((player) => player.kills === topFragger.kills).map((player) => player.player_name);

                if (topFraggers.includes(predictionDoc.topFragger)) {
                    topFraggerGuessed = true;
                    points++;
                }
                
                if (predictionDoc.predictedOutcome === "firstTeamWin" && parseInt(match.team_one_score) > parseInt(match.team_two_score) ) {
                    predictedOutcomeGuessed = "onlyWinnerTeam";
                    points++;
                }
                
                if (predictionDoc.predictedOutcome === "secondTeamWin" && parseInt(match.team_one_score) < parseInt(match.team_two_score) ) {
                    predictedOutcomeGuessed = "onlyWinnerTeam";
                    points++;
                }
                
                if (predictedScore === actualScore) {
                    points++;
                    predictedOutcomeGuessed = "wholeScore";
                }


                // console.log(points)

                await predictionSchema.updateOne({ _id: predictionDoc._id }, { checkedAt: Date.now(), checked: true, points, topFraggerGuessed, predictedOutcomeGuessed });

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