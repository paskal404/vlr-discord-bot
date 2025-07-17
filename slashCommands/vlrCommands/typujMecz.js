const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { eventSchema } = require('../../models/Event'); // Model dla wydarzenia
const { predictionSchema } = require('../../models/Prediction'); // Model dla wydarzenia
const settings = require("../../utils/config.json")

function parseAndValidateScore(scoreArray) {
	if (scoreArray.length !== 2) {
		throw new Error("Score format is invalid. It should be in 'number:number' format.");
	}

	const [first, second] = scoreArray.map(Number);

	if (isNaN(first) || isNaN(second)) {
		throw new Error("Score contains invalid numbers.");
	}

	return [first, second];
}

function getWeekNumber(firstMatchTimestamp, currentMatchTimestamp) {
	// Convert timestamps to dates
	const firstDate = new Date(firstMatchTimestamp * 1000);
	const currentDate = new Date(currentMatchTimestamp * 1000);

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

	return weekNumber;
}

module.exports = {
	name: "typuj-mecz",
	data: new SlashCommandBuilder()
		.setName('typuj-mecz')
		.setDescription('Typuje wynik')
		.addStringOption(option =>
			option.setName('event')
				.setDescription('Podaj event')
				.setAutocomplete(true)
				.setRequired(true))
		.addStringOption(option =>
			option.setName('mecz')
				.setDescription('Podaj mecz jaki chcesz typować')
				.setAutocomplete(true)
				.setRequired(true))
		.addStringOption(option =>
			option.setName('wynik-meczu')
				.setDescription('Podaj wynik w formacie X:X np 2:1')
				.setRequired(true))
		.addStringOption(option =>
			option.setName('najlepszy-fragger')
				.setDescription('Podaj nick najlepszego fraggera')
				.setAutocomplete(true)
				.setRequired(true))
		.setDMPermission(false)
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

	async autocomplete(interaction) {
		const focusedOption = interaction.options.getFocused(true);

		if (focusedOption.name === 'event') {
			const events = await eventSchema.find({ guildId: interaction.guild.id });

			const filtered = events.filter(event => event.name.startsWith(focusedOption.value));

			interaction.respond(
				filtered.map(event => ({ name: event.name, value: event.eventId })),
			);

			return;
		} else if (focusedOption.name === 'mecz') {
			const eventId = interaction.options.getString("event");

			let event = await eventSchema.findOne({ guildId: interaction.guild.id, $or: [{ eventId }, { name: eventId }] });
			if (!event) return;

			const unavailableMatches = event.matches.filter(match => match.status !== "upcoming").map(match => match.matchId);
			let matchesAlreadyPredicted = await predictionSchema.find({ guildId: interaction.guild.id, userId: interaction.user.id, eventId: event.eventId });
			matchesAlreadyPredicted = matchesAlreadyPredicted.map(match => match.matchId);

			let matches = event.matches.filter(match => !unavailableMatches.includes(match.matchId) && !matchesAlreadyPredicted.includes(match.matchId));

			// Filter out matches with TBD and specific match ID
			matches = matches.filter(match => !`${match.team_one_name} vs. ${match.team_two_name}`.includes("TBD") && match.matchId !== "86470");

			// Sort matches by timestamp to ensure consistent week numbering
			matches.sort((a, b) => a.timestamp - b.timestamp);

			if (matches.length === 0) {
				interaction.respond([]);
				return;
			}

			// Get the timestamp of the first match for week calculation
			const firstMatchTimestamp = matches[0].timestamp;

			// Add week numbers to matches
			const matchesWithWeeks = matches.map(match => {
				const weekNumber = getWeekNumber(firstMatchTimestamp, match.timestamp);
				return {
					...match,
					weekNumber,
					displayName: `[Week ${weekNumber}] ${match.team_one_name} vs. ${match.team_two_name} (${match.bo}) [${match.matchId}]`,
					value: `${match.team_one_name} vs. ${match.team_two_name} (${match.bo}) [${match.matchId}]`
				};
			});

			// Filter by user input
			let filtered = matchesWithWeeks.filter(match =>
				match.displayName.toLowerCase().includes(focusedOption.value.toLowerCase()) ||
				match.matchId.startsWith(focusedOption.value)
			);

			// Limit to 25 results
			filtered = filtered.slice(0, 25);

			interaction.respond(
				filtered.map(match => ({ name: match.displayName, value: match.value })),
			);

			return;
		} else if (focusedOption.name === 'najlepszy-fragger') {
			const eventId = interaction.options.getString("event");
			const matchName = interaction.options.getString("mecz").replace(/\(bo\d+\)/i, '').trim();
			const matchId = interaction.options.getString("mecz").match(/\[(.*?)\]/)[1];

			let event = await eventSchema.findOne({ guildId: interaction.guild.id, $or: [{ eventId }, { name: eventId }] });
			if (!event) return;

			let match = event.matches.find(eventMatch => eventMatch.matchId === matchId);
			if (!match) {
				throw new Error("Match not found");
			}

			const allPlayers = match.team_one_players.concat(match.team_two_players).map(player => player.player_name);

			interaction.respond(
				allPlayers.map(player => ({ name: player, value: player })),
			);
		}
		return;

	},
	run: async (client, interaction) => {
		await interaction.deferReply({ ephemeral: true });

		const eventId = interaction.options.getString('event');
		const matchTitle = interaction.options.getString('mecz').replace(/\(bo\d+\)/i, '').replace(/\[.*?\]/, '').trim();
		const matchId = interaction.options.getString("mecz").match(/\[(.*?)\]/)[1];

		let event = await eventSchema.findOne({ guildId: interaction.guild.id, eventId });

		if (!event) {
			event = await eventSchema.findOne({ guildId: interaction.guild.id, name: eventId });

			if (!event) {
				return interaction.editReply({
					embeds: [
						new EmbedBuilder()
							.setTitle("Typowanie")
							.setColor(settings.color_red)
							.setDescription("Nie znaleziono podanego eventu! Spróbuj wybrać ponownie!")
					]
				})
			}
		}

		const alreadyPredicted = await predictionSchema.findOne({ guildId: interaction.guild.id, userId: interaction.user.id, eventId: event.eventId, matchId });

		if (alreadyPredicted) {
			return interaction.editReply({
				embeds: [
					new EmbedBuilder()
						.setTitle("Typowanie")
						.setColor(settings.color_red)
						.setDescription("Już typujesz ten mecz")
				]
			})
		}

		const score = interaction.options.getString('wynik-meczu').split(":");

		const topFragger = interaction.options.getString('najlepszy-fragger') ? interaction.options.getString('najlepszy-fragger') : false;

		try {
			// Validate and parse the main score
			var [firstScore, secondScore] = parseAndValidateScore(score);
			// Now you have all scores as numbers

		} catch (error) {
			return interaction.editReply({
				embeds: [
					new EmbedBuilder()
						.setTitle("Typowanie")
						.setColor(settings.color_red)
						.setDescription("Podaj wynik w formacie \`X:X\` np \`13:1\`")
				]
			})
		}

		const matches = event.matches;

		const match = matches.find((match) => match.matchId === matchId);

		if (!match) {
			return interaction.editReply({
				embeds: [
					new EmbedBuilder()
						.setTitle("Typowanie")
						.setColor(settings.color_red)
						.setDescription("Nie znaleziono podanego meczu!")
				]
			})
		}

		if (match.matchId === "86470") {
			return interaction.editReply({
				embeds: [
					new EmbedBuilder()
						.setTitle("Typowanie")
						.setColor(settings.color_red)
						.setDescription("Tego meczu nie można obstawić!")
				]
			})
		}

		if (match.status !== "upcoming") {
			return interaction.editReply({
				embeds: [
					new EmbedBuilder()
						.setTitle("Typowanie")
						.setColor(settings.color_red)
						.setDescription("Nie możesz typować meczu, który już się skończył, lub dopiero zaczął!")
				]
			})
		}

		if (topFragger) {
			const doesPlayerExist = match.team_one_players.concat(match.team_two_players).find(player => player.player_name === topFragger);

			if (!doesPlayerExist) {
				return interaction.editReply({
					embeds: [
						new EmbedBuilder()
							.setTitle("Typowanie")
							.setColor(settings.color_red)
							.setDescription("Podany gracz nie bierze udziału w meczu!")
					]
				})
			}
		}

		// let matches = [];

		// for (let i = 0; i < event.bracketContainers.length; i++) {
		//     for (let j = 0; j < event.bracketContainers[i].matches.length; j++) {
		//         matches.push(event.bracketContainers[i].matches[j]);
		//     }
		// }

		// const match = matches.find((match) => match.title === matchTitle);

		if (Math.trunc(Date.now() / 1000) > match.status) {
			return interaction.editReply({
				embeds: [
					new EmbedBuilder()
						.setTitle("Obstawianie")
						.setColor(settings.color_red)
						.setDescription("Nie możesz obstawić meczu, który już się skończył, lub dopiero zaczął!")
				]
			})
		}

		let predictionObject = { guildId: interaction.guild.id, userId: interaction.user.id, eventId: event.eventId, matchTitle, matchId, matchScore: { firstScore, secondScore }, checked: false, createdAt: Date.now() };

		if (firstScore > secondScore) {
			predictionObject.predictedOutcome = "firstTeamWin";
		} else if (firstScore === secondScore) {
			predictionObject.predictedOutcome = "draw";
		} else if (firstScore < secondScore) {
			predictionObject.predictedOutcome = "secondTeamWin";
		}

		// if (firstScore < 13 && secondScore < 13) {
		// 	return interaction.editReply({
		// 		embeds: [
		// 			new EmbedBuilder()
		// 				.setTitle("Typowanie")
		// 				.setColor(settings.color_red)
		// 				.setDescription("Wynik meczu musi mieć co najmniej 13 punktów dla jednej z drużyn!")
		// 		]
		// 	});
		// }

		// if (match.bo === "Bo1" && (firstScore < 13 && secondScore < 13)) {
		// 	return interaction.editReply({
		// 		embeds: [
		// 			new EmbedBuilder()
		// 				.setTitle("Typowanie")
		// 				.setColor(settings.color_red)
		// 				.setDescription("Wynik meczu musi mieć co najmniej 13 punktów dla jednej z drużyn!")
		// 		]
		// 	});
		// }

		if (topFragger) {
			predictionObject.topFragger = topFragger;
		}

		await new predictionSchema(predictionObject).save();

		return interaction.editReply({
			embeds: [
				new EmbedBuilder()
					.setTitle("Typowanie")
					.setColor(settings.color_green)
					.setDescription(`${settings.emoji_success} Pomyślnie typujesz mecz \`${match.team_one_name} vs. ${match.team_two_name}\` z wynikiem \`${interaction.options.getString('wynik-meczu')}\``)
			]
		});

	}
};