const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Collection } = require('discord.js');
const { predictionSchema } = require('../../models/Prediction'); // Model dla wydarzenia
const { eventSchema } = require("../../models/Event")
const settings = require("../../utils/settings.json")
const pagination = require("../../utils/pagination");

module.exports = {
	name: "typowanie",
	data: new SlashCommandBuilder()
		.setName('typowanie')
		.setDescription('Pokazuje twoje typowania')

		.setDMPermission(false)
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

	run: async (client, interaction) => {
		await interaction.deferReply({ ephemeral: true });

		const events = await eventSchema.find({ guildId: interaction.guild.id });

		let predictions = await predictionSchema.find({ guildId: interaction.guild.id, userId: interaction.user.id }).lean();

		if (predictions.length === 0) {
			return interaction.editReply({
				embeds: [
					new EmbedBuilder()
						.setTitle("Typowanie")
						.setColor(settings.color_red)
						.setDescription("Nie posiadam żadnych informacji o twoich typowaniach, najpierw wpisz \`/typuj-mecz\` i spróbuj ponownie!")
				]
			});
		}

		let page = 1;
		const predictionPages = Math.ceil(predictions.length / 8);

		const embed = new EmbedBuilder()
			.setTitle("Typowanie")
			.setColor(settings.color_green)
			.setFooter({ text: `Strona ${page}/${predictionPages}` })

		const paginationData = await pagination.getPagination(predictions, events, page, predictionPages);

		const row = new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setCustomId(`predBack`)
					.setLabel('Poprzednia strona')
					.setDisabled(page === 1)
					.setStyle(ButtonStyle.Primary),
			)
			.addComponents(
				new ButtonBuilder()
					.setCustomId(`predNext`)
					.setLabel('Nastepna strona')
					.setDisabled(page + 1 > predictionPages)
					.setStyle(ButtonStyle.Primary),
			)

		embed.setDescription(paginationData);

		return interaction.editReply({ embeds: [embed], components: [row] });

	}
};
