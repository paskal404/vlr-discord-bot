const moment = require("moment-timezone");
const settings = require("./config.json");

const weekTimestamps = {
	"Playoffs": "1740628800",
	"EMEA Stage 1": "1739736655",
	// 4: "1738537200",
	// 3: "1737932400",
	// 2: "1737327600",
	// 1: "1736722800",
}

module.exports.getPagination = async (predictions, events, page, predictionPages) => {
	let description = "Oto mecze które typujesz:\n\n";

	let sortedMatches = [];

	for (const predictedMatch of predictions) {
		const event = events.find(event => event.eventId === predictedMatch.eventId);
		if (!event) continue;

		const match = event.matches.find(match => predictedMatch.matchId == match.matchId);
		if (!match) continue;

		let matchTimestamp = match.timestamp;

		// for (let i = 0; i < event.bracketContainers.length; i++) {
		// 	for (let j = 0; j < event.bracketContainers[i].matches.length; j++) {
		// 		if (event.bracketContainers[i].matches[j].teams.map(team => team.name).join(" vs. ") == `${match.team_one_name} vs. ${match.team_two_name}`) {
		// 			matchTimestamp = event.bracketContainers[i].matches[j].status;
		// 		}
		// 	}
		// }
		if (!matchTimestamp) continue;

		const matchTime = moment.unix(matchTimestamp);
		let weekNumber = null;

		for (const [week, timestamp] of Object.entries(weekTimestamps)) {
			const weekTime = moment.unix(timestamp);
			if (matchTime.isAfter(weekTime)) {
				if (!weekNumber) {
					weekNumber = week;
				}
				if (week > weekNumber) {
					weekNumber = week;
				}
			}
		}

		if (weekNumber) {
			predictedMatch.weekNumber = weekNumber;
			sortedMatches.push(predictedMatch);
		}
	}

	const allMatches = predictions.map(predictedMatch => predictedMatch.matchTitle);
	const sortedMatchesTitles = sortedMatches.map(predictedMatch => predictedMatch.matchTitle);

	const notAddedMatches = allMatches.filter(matchTitle => !sortedMatchesTitles.includes(matchTitle));

	if (notAddedMatches.length > 0) {
		for (const matchTitle of notAddedMatches) {
			const match = predictions.find(predictedMatch => predictedMatch.matchTitle === matchTitle);
			match.weekNumber = 0;
			sortedMatches.push(match);
		}
	}

	sortedMatches.sort((a, b) => b.weekNumber - a.weekNumber);

	for (let i = 0; i < sortedMatches.length; i++) {
		let predictedMatch = sortedMatches[i];
		predictedMatch.description = "";

		predictedMatch.description += `- ${predictedMatch.weekNumber == 0 ? `` : `(**Week ${predictedMatch.weekNumber}**)`} Mecz \`${predictedMatch.matchTitle}\` (${predictedMatch.checked ? `sprawdzony` : `niesprawdzony`})\n`;

		if (predictedMatch.checked) {
			let predictedScore;

			if (predictedMatch.predictedOutcomeGuessed === "false") {
				predictedScore = `${settings.emoji_wrong2} **0** pkt`
			} else if (predictedMatch.predictedOutcomeGuessed === "onlyWinnerTeam") {
				predictedScore = `${settings.emoji_checkmark2} +**1** pkt`
			} else if (predictedMatch.predictedOutcomeGuessed === "wholeScore") {
				predictedScore = `${settings.emoji_checkmark2} +**2** pkt`
			}

			predictedMatch.description += `  - Obstawiony wynik: \`${predictedMatch.matchScore.firstScore}:${predictedMatch.matchScore.secondScore}\` ${predictedScore}\n`

			predictedMatch.description += `  - Obstawiony najlepszy gracz: \`${predictedMatch.topFragger}\` ${predictedMatch.topFraggerGuessed ? `${settings.emoji_checkmark2} +**1** pkt` : `${settings.emoji_wrong2} **0** pkt`}\n`

			predictedMatch.description += `  - Końcowa ilość punktów za obstawiony mecz: **${predictedMatch.points}** pkt\n\n`
		} else {
			predictedMatch.description += `  - Obstawiony wynik: \`${predictedMatch.matchScore.firstScore}:${predictedMatch.matchScore.secondScore}\`\n`
			predictedMatch.description += `  - Obstawiony najlepszy gracz: \`${predictedMatch.topFragger}\`\n`

			predictedMatch.description += `\n`;
		}
	}

	description += sortedMatches.slice((page - 1) * 8, page * 8).map(predictedMatch => (
		`${predictedMatch.description}`
	)).join('')

	return description;
}
