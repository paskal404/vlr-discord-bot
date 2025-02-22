const { predictionSchema } = require('../../models/Prediction'); // Model dla wydarzenia
const { eventSchema } = require("../../models/Event")
const { EmbedBuilder, ButtonStyle, ActionRowBuilder, ButtonBuilder } = require("discord.js");
const settings = require("../../utils/config.json")

const pagination = require("../../utils/pagination");

module.exports = {
	name: 'interactionCreate',
	once: false,
	async run(client, interaction) {
		if (!interaction.isButton()) return;

		const guild = interaction.guild;
		const member = interaction.member;
		let message = interaction.message;
		const customId = interaction.customId;

		if (!['predNext', 'predBack'].includes(customId)) return;

		await interaction.deferUpdate();

		const footer_page = message.embeds[0].data.footer.text.replace("Strona ", "");
		// eslint-disable-next-line no-unused-vars
		const [current_page, total_pages] = footer_page.split("/").map(Number);
		const page = customId === 'predNext' ? current_page + 1 : current_page - 1;

		const events = await eventSchema.find({ guildId: guild.id });
		let predictions = await predictionSchema.find({ guildId: guild.id, userId: member.id }).lean()
		const predictionPages = Math.ceil(predictions.length / 8);

		if (predictionPages === 0) {
			return interaction.editReply({
				embeds: [
					new EmbedBuilder()
						.setTitle("Typowanie")
						.setColor(settings.color_red)
						.setDescription("Nie posiadam żadnych informacji o twoich typowaniach, najpierw wpisz \`/typuj-mecz\` i spróbuj ponownie!")
				]
			});
		}

		const paginationData = await pagination.getPagination(predictions, events, page, predictionPages);

		const embed = new EmbedBuilder()
			.setColor(settings.color_green)
			.setTitle("Typowanie")
			.setFooter({ text: `Strona ${page}/${predictionPages}` })
			.setDescription(paginationData);

		await interaction.followUp({
			ephemeral: true,
			embeds: [embed.data],
			components: [
				new ActionRowBuilder()
					.addComponents(
						new ButtonBuilder()
							.setCustomId(`predBack`)
							.setLabel('Poprzednia strona')
							.setDisabled(page === 1)
							.setStyle(ButtonStyle.Primary),
						new ButtonBuilder()
							.setCustomId(`predNext`)
							.setLabel('Nastepna strona')
							.setDisabled(page >= predictionPages)
							.setStyle(ButtonStyle.Primary)
					)
			]
		});
	},
};
