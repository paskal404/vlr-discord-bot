const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { eventSchema } = require('../../models/Event'); // Model dla wydarzenia
const { predictionSchema } = require('../../models/Prediction'); // Model dla wydarzenia
const settings = require("../../utils/settings.json")

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
		} else if (focusedOption.name === 'najlepszy-fragger') {
			const eventId = interaction.options.getString("event");
			const matchName = interaction.options.getString("mecz").replace(/\(bo\d+\)/i, '').trim();

			let event = await eventSchema.findOne({ guildId: interaction.guild.id, $or: [{ eventId }, { name: eventId }] });
			if (!event) return;

			let match = event.matches.find(eventMatch => `${eventMatch.team_one_name} vs. ${eventMatch.team_two_name}` === matchName);

			const allPlayers = match.team_one_players.concat(match.team_two_players).map(player => player.player_name);

			interaction.respond(
				allPlayers.map(player => ({ name: player, value: player })),
			);

			return;

		} else if (focusedOption.name === 'mecz') {
			const eventId = interaction.options.getString("event");

			let event = await eventSchema.findOne({ guildId: interaction.guild.id, $or: [{ eventId }, { name: eventId }] });
			if (!event) return;

			const unavailableMatches = event.matches.filter(match => match.status !== "upcoming").map(match => `${match.team_one_name} vs. ${match.team_two_name}`);
			let matchesAlreadyPredicted = await predictionSchema.find({ guildId: interaction.guild.id, userId: interaction.user.id, eventId: event.eventId });
			matchesAlreadyPredicted = matchesAlreadyPredicted.map(match => match.matchTitle);

			const matches = event.matches.filter(match => !unavailableMatches.includes(`${match.team_one_name} vs. ${match.team_two_name}`) && !matchesAlreadyPredicted.includes(`${match.team_one_name} vs. ${match.team_two_name}`));

			// let matches = [];

			// for (let i = 0; i < event.bracketContainers.length; i++) {
			//     for (let j = 0; j < event.bracketContainers[i].matches.length; j++) {
			//         matches.push(event.bracketContainers[i].matches[j]);
			//     }
			// }

			const filtered = matches.filter(match => `${match.team_one_name} vs. ${match.team_two_name}`.startsWith(focusedOption.value) && !`${match.team_one_name} vs. ${match.team_two_name}`.includes("TBD"));

			interaction.respond(
				filtered.map(match => ({ name: `${match.team_one_name} vs. ${match.team_two_name} (${match.bo})`, value: `${match.team_one_name} vs. ${match.team_two_name} (${match.bo})` })),
			);

			return;
		}
	},
	run: async (client, interaction) => {
		await interaction.deferReply({ ephemeral: true });

		const eventId = interaction.options.getString('event');
		const matchTitle = interaction.options.getString('mecz').replace(/\(bo\d+\)/i, '').trim();

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

		const alreadyPredicted = await predictionSchema.findOne({ guildId: interaction.guild.id, userId: interaction.user.id, eventId: event.eventId, matchTitle });

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

		const match = matches.find((match) => `${match.team_one_name} vs. ${match.team_two_name}` === matchTitle);

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

		let predictionObject = { guildId: interaction.guild.id, userId: interaction.user.id, eventId: event.eventId, matchTitle, matchScore: { firstScore, secondScore }, checked: false, createdAt: Date.now() };

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
