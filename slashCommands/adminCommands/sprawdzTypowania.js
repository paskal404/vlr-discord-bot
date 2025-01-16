const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const settings = require("../../utils/settings.json");

const { predictionSchema } = require('../../models/Prediction');

module.exports = {
	name: "sprawdź-typowania",
	data: new SlashCommandBuilder()
		.setName('sprawdź-typowania')
		.setDescription('Sprawdza statystyki typowania użytkowników')

		.setDMPermission(false)
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
	run: async (client, interaction) => {
		await interaction.deferReply({ ephemeral: true });

		const predictionCount = await predictionSchema.aggregate([
			{
				$group: {
					_id: "$matchTitle", // Grupowanie po tytule meczu
					uniqueUsers: { $addToSet: "$userId" } // Zbiór unikalnych userId dla każdego meczu
				}
			},
			{
				$project: {
					_id: 1,
					userCount: { $size: "$uniqueUsers" } // Liczba unikalnych użytkowników
				}
			},
			{
				$sort: { userCount: -1 } // Sortowanie od największej liczby do najmniejszej
			}
		]);

		const uniqueUsers = await predictionSchema.aggregate([
			{
				$group: {
					_id: null, // Grupowanie wszystkiego razem
					uniqueUsers: { $addToSet: "$userId" } // Zbiór unikalnych userId
				}
			},
			{
				$project: {
					_id: 0, // Ukrycie pola _id w wyniku
					totalUniqueUsers: { $size: "$uniqueUsers" } // Liczba unikalnych użytkowników
				}
			}
		]);

		return interaction.editReply({
			embeds: [
				new EmbedBuilder()
				.setTitle("Statystyki typowania")
				.setColor(settings.color_green)
				.setDescription(`Liczba użytkowników, którzy obstawili jakikolwiek mecz (unikalni użytkownicy): **${uniqueUsers[0].totalUniqueUsers}**\n\n${predictionCount.map((match, index) => `**${index + 1}.** \`${match._id}\` - **${match.userCount}** użytkowników`).join("\n")}`)
			]
		})

	}
};
