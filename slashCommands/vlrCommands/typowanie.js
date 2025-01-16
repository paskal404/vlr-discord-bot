const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { predictionSchema } = require('../../models/Prediction'); // Model dla wydarzenia
const settings = require("../../utils/settings.json")

module.exports = {
	name: "typowanie",
	data: new SlashCommandBuilder()
		.setName('typowanie')
		.setDescription('Pokazuje twoje typowania')

		.setDMPermission(false)
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

	run: async (client, interaction) => {
		await interaction.deferReply({ ephemeral: true });

		const predictions = await predictionSchema.find({ guildId: interaction.guild.id, userId: interaction.user.id });

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
		const predPages = Math.ceil(predictions.length / 8);

		const embed = new EmbedBuilder()
			.setTitle("Typowanie")
			.setColor(settings.color_green)
			.setFooter({ text: `Strona ${page}/${predPages}` })

		let description = "Oto mecze które typujesz:\n\n";

		for (const predictedMatch of predictions) {
			predictedMatch.description = "";

			predictedMatch.description += `- Mecz \`${predictedMatch.matchTitle}\` (${predictedMatch.checked ? `sprawdzony` : `niesprawdzony`})\n`;

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

				predictedMatch.description += `  - Obstawiony najlepszy gracz: \`${predictedMatch.topFragger || "brak"}\` ${predictedMatch.topFraggerGuessed ? `${settings.emoji_checkmark2} +**1** pkt` : `${settings.emoji_wrong2} **0** pkt`}\n`

				predictedMatch.description += `  - Końcowa ilość punktów za obstawiony mecz: **${predictedMatch.points}** pkt\n\n`
			} else {
				predictedMatch.description += `  - Obstawiony wynik: \`${predictedMatch.matchScore.firstScore}:${predictedMatch.matchScore.secondScore}\`\n`
				predictedMatch.description += `  - Obstawiony najlepszy gracz: \`${predictedMatch.topFragger || "brak"}\`\n`

				predictedMatch.description += `\n`;
			}
		}

		description += predictions.slice((page - 1) * 8, page * 8).map(predictedMatch => (
			`${predictedMatch.description}`
		)).join('')

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
                        .setDisabled(page + 1 > predPages)
                        .setStyle(ButtonStyle.Primary),
                )

		embed.setDescription(description);

		return interaction.editReply({ embeds: [embed],components: [row] });

	}
};
