const { SlashCommandBuilder } = require('discord.js');
const { predictionSchema } = require('../../models/Prediction'); // Model dla wydarzenia
const discord = require("discord.js");
const settings = require("../../utils/settings.json")

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

		const predictions = await predictionSchema.find({ guildId: guild.id, userId: member.id });
		const predPages = Math.ceil(predictions.length / 8);

		if (predPages === 0) {
			return interaction.editReply({
				embeds: [
					new discord.EmbedBuilder()
						.setTitle("Typowanie")
						.setColor(settings.color_red)
						.setDescription("Nie posiadam żadnych informacji o twoich typowaniach, najpierw wpisz \`/typuj-mecz\` i spróbuj ponownie!")
				]
			});
		}

		let description = "Oto mecze które typujesz:\n\n";

		for (const predictedMatch of predictions) {
			// console.log(predictedMatch);
			predictedMatch.description = "";

			predictedMatch.description += `- Mecz \`${predictedMatch.matchTitle}\` (${predictedMatch.checked ? `sprawdzony` : `niesprawdzony`})\n`;

			if (predictedMatch.checked) {
				let predictedScore;

				if (predictedMatch.predictedOutcomeGuessed === "false") {
					predictedScore = `\\❌ **0** pkt`
				} else if (predictedMatch.predictedOutcomeGuessed === "onlyWinnerTeam") {
					predictedScore = `\\✅ +**1** pkt`
				} else if (predictedMatch.predictedOutcomeGuessed === "wholeScore") {
					predictedScore = `\\✅ +**2** pkt`
				}

				predictedMatch.description += `  - Obstawiony wynik: \`${predictedMatch.matchScore.firstScore}:${predictedMatch.matchScore.secondScore}\` ${predictedScore}\n`

				predictedMatch.description += `  - Obstawiony najlepszy gracz: \`${predictedMatch.topFragger}\` ${predictedMatch.topFraggerGuessed ? `\\✅ +**1** pkt` : `\\❌ **0** pkt`}\n`

				for (let i = 0; i < predictedMatch.mapScores.length; i++) {
					predictedMatch.description += `  - Obstawiłeś mapę #${i + 1} \`${predictedMatch.mapScores[i].firstScore}:${predictedMatch.mapScores[i].secondScore}\` ${predictedMatch.mapScores[i].guessed ? `\\✅` : `\\❌`}\n`
					//predictedMatch.description += `    - \n`
				}

				if (predictedMatch.allMapsGuessed) {
					predictedMatch.description += `  - \\✅ Wszystkie mapy obstawione poprawnie +**1** pkt\n`
				}

				predictedMatch.description += `  - Końcowa ilość punktów za obstawiony mecz: **${predictedMatch.points}** pkt\n\n`
			} else {
				predictedMatch.description += `  - Obstawiony wynik: \`${predictedMatch.matchScore.firstScore}:${predictedMatch.matchScore.secondScore}\`\n`
				predictedMatch.description += `  - Obstawiony najlepszy gracz: \`${predictedMatch.topFragger}\`\n`

				for (let i = 0; i < predictedMatch.mapScores.length; i++) {
					predictedMatch.description += `  - Obstawiłeś mapę #${i + 1} \`${predictedMatch.mapScores[i].firstScore}:${predictedMatch.mapScores[i].secondScore}\`\n`
				}

				predictedMatch.description += `\n`;
			}

			//let predictStatus = "";

			// if (predictedMatch.checked) {
			//     predictStatus = predictedMatch.points > 0 ? `✅ (**${predictedMatch.points}** pkt) ` : `❌ (**${predictedMatch.points}** pkt) `
			// }

			// description += `- ${predictStatus}${predictedMatch.matchTitle} \`${predictedMatch.matchScore.firstScore}:${predictedMatch.matchScore.secondScore}\`\n`

			// if (predictedMatch.topFragger) {
			//     description += `  * Obstawiony najlepszy gracz: \`${predictedMatch.topFragger}\`\n`
			// }

			// for (let i = 0; i < predictedMatch.mapScores.length; i++) {
			//     description += `  * Mapa #${i + 1} \`${predictedMatch.mapScores[i].firstScore}:${predictedMatch.mapScores[i].secondScore}\`\n`
			// }
		}

		description += predictions.slice((page - 1) * 8, page * 8).map(predictedMatch => (
			`${predictedMatch.description}`
		)).join('')

		const embed = new discord.EmbedBuilder()
			.setColor(settings.color_green)
			.setTitle("Typowanie")
			.setFooter({ text: `Strona ${page}/${predPages}` })
			.setDescription(description);

		await interaction.followUp({
			ephemeral: true,
			embeds: [embed.data],
			components: [
				new discord.ActionRowBuilder()
					.addComponents(
						new discord.ButtonBuilder()
							.setCustomId(`predBack`)
							.setLabel('Poprzednia strona')
							.setDisabled(page === 1)
							.setStyle(discord.ButtonStyle.Primary),
						new discord.ButtonBuilder()
							.setCustomId(`predNext`)
							.setLabel('Nastepna strona')
							.setDisabled(page >= predPages)
							.setStyle(discord.ButtonStyle.Primary)
					)
			]
		});
	},
};
