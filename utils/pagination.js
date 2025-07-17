const moment = require("moment-timezone");
const settings = require("./config.json");

function getWeekNumber(firstMatchTimestamp, currentMatchTimestamp) {
	// Validate inputs
	if (!firstMatchTimestamp || !currentMatchTimestamp) {
		console.error('Invalid timestamps provided to getWeekNumber');
		return 1; // Default to week 1 if invalid
	}

	// Convert timestamps to dates
	const firstDate = new Date(firstMatchTimestamp * 1000);
	const currentDate = new Date(currentMatchTimestamp * 1000);

	// Validate dates
	if (isNaN(firstDate.getTime()) || isNaN(currentDate.getTime())) {
		console.error('Invalid date conversion in getWeekNumber');
		return 1; // Default to week 1 if invalid
	}

	// Get the start of the week (Monday) for the first match
	const firstWeekStart = new Date(firstDate);
	const dayOfWeek = firstDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
	const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert Sunday to 6, others to dayOfWeek - 1
	firstWeekStart.setDate(firstDate.getDate() - daysToMonday);
	firstWeekStart.setHours(0, 0, 0, 0);

	// Calculate the difference in milliseconds
	const timeDiff = currentDate.getTime() - firstWeekStart.getTime();

	// Convert to days and then to weeks
	const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
	const weekNumber = Math.floor(daysDiff / 7) + 1;

	// Ensure week number is at least 1
	return Math.max(1, weekNumber);
}

module.exports.getPagination = async (predictions, events, page, predictionPages) => {
	let description = "Oto mecze które typujesz:\n\n";

	let sortedMatches = [];

	// Group predictions by event to calculate week numbers per event
	const predictionsByEvent = {};

	for (const predictedMatch of predictions) {
		const event = events.find(event => event.eventId === predictedMatch.eventId);
		if (!event) continue;

		const match = event.matches.find(match => predictedMatch.matchId == match.matchId);
		if (!match) continue;

		let matchTimestamp = match.timestamp;
		if (!matchTimestamp) continue;

		// Group by event
		if (!predictionsByEvent[predictedMatch.eventId]) {
			predictionsByEvent[predictedMatch.eventId] = {
				event: event,
				predictions: []
			};
		}

		predictionsByEvent[predictedMatch.eventId].predictions.push({
			...predictedMatch,
			matchTimestamp: matchTimestamp,
			match: match
		});
	}

	// Calculate week numbers for each event
	for (const [eventId, eventData] of Object.entries(predictionsByEvent)) {
		const { event, predictions: eventPredictions } = eventData;

		// Get all matches from this event and find the earliest timestamp
		const allEventMatches = event.matches.filter(match => match.timestamp);
		if (allEventMatches.length === 0) continue;

		// Sort matches by timestamp to find the first one
		allEventMatches.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
		const firstMatchTimestamp = allEventMatches[0].timestamp;

		// Calculate week numbers for predictions in this event
		for (const predictedMatch of eventPredictions) {
			const weekNumber = getWeekNumber(firstMatchTimestamp, predictedMatch.matchTimestamp);
			predictedMatch.weekNumber = weekNumber;
			sortedMatches.push(predictedMatch);
		}
	}

	// Handle any predictions that couldn't be processed (no week number assigned)
	const allMatches = predictions.map(predictedMatch => predictedMatch.matchTitle);
	const sortedMatchesTitles = sortedMatches.map(predictedMatch => predictedMatch.matchTitle);
	const notAddedMatches = allMatches.filter(matchTitle => !sortedMatchesTitles.includes(matchTitle));

	if (notAddedMatches.length > 0) {
		for (const matchTitle of notAddedMatches) {
			const match = predictions.find(predictedMatch => predictedMatch.matchTitle === matchTitle);
			match.weekNumber = 0; // Unknown week
			sortedMatches.push(match);
		}
	}

	// Sort by week number (highest first) and then by timestamp
	sortedMatches.sort((a, b) => {
		if (a.weekNumber !== b.weekNumber) {
			return b.weekNumber - a.weekNumber;
		}
		// If same week, sort by timestamp (if available)
		const aTimestamp = a.matchTimestamp || 0;
		const bTimestamp = b.matchTimestamp || 0;
		return bTimestamp - aTimestamp;
	});

	// Generate descriptions
	for (let i = 0; i < sortedMatches.length; i++) {
		let predictedMatch = sortedMatches[i];
		predictedMatch.description = "";

		const weekDisplay = predictedMatch.weekNumber === 0 ? `` : `(**Week ${predictedMatch.weekNumber}**)`;
		predictedMatch.description += `- ${weekDisplay} Mecz \`${predictedMatch.matchTitle}\` (${predictedMatch.checked ? `sprawdzony` : `niesprawdzony`})\n`;

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