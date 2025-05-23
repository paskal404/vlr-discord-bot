const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { eventSchema } = require('../../models/Event'); // Model dla wydarzenia
const { predictionSchema } = require('../../models/Prediction'); // Model dla wydarzenia
const settings = require("../../utils/config.json")

module.exports = {
	name: "cofnij-typowanie",
	data: new SlashCommandBuilder()
		.setName('cofnij-typowanie')
		.setDescription('Cofa typowany przez Ciebie mecz')
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

			let matchesAlreadyPredicted = await predictionSchema.find({ guildId: interaction.guild.id, userId: interaction.user.id, eventId: event.eventId, checked: false });

			matchesAlreadyPredicted = matchesAlreadyPredicted.slice(0, 25);

			interaction.respond(
				matchesAlreadyPredicted.map(match => ({ name: `${match.matchTitle} [${match.matchId}]`, value: `${match.matchTitle} [${match.matchId}]` })),
			);

			return;
		}
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

		const predictedMatch = await predictionSchema.findOne({ guildId: interaction.guild.id, userId: interaction.user.id, eventId: event.eventId, matchId });

		if (!predictedMatch) {
			return interaction.editReply({
				embeds: [
					new EmbedBuilder()
						.setTitle("Typowanie")
						.setColor(settings.color_red)
						.setDescription("Nie typujesz tego meczu!")
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

		if (match.status !== "upcoming") {
			return interaction.editReply({
				embeds: [
					new EmbedBuilder()
						.setTitle("Typowanie")
						.setColor(settings.color_red)
						.setDescription("Nie możesz cofnąć typowania meczu, który już się skończył, lub dopiero zaczął!")
				]
			})
		}

		if (Math.trunc(Date.now() / 1000) > match.status) {
			return interaction.editReply({
				embeds: [
					new EmbedBuilder()
						.setTitle("Obstawianie")
						.setColor(settings.color_red)
						.setDescription("Nie możesz cofnąć typowania meczu, który już się skończył, lub dopiero zaczął!")
				]
			})
		}

		await predictionSchema.deleteOne({ _id: predictedMatch._id });

		return interaction.editReply({
			embeds: [
				new EmbedBuilder()
					.setTitle("Typowanie")
					.setColor(settings.color_green)
					.setDescription(`${settings.emoji_success} Pomyślnie cofnięto typowanie meczu **${matchTitle}**! Możesz teraz ponownie typować ten mecz!`)
			]
		});

	}
};
