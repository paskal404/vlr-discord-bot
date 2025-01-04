const { SlashCommandBuilder } = require('discord.js');
const { predictionSchema } = require('../../models/Prediction'); // Model dla wydarzenia
const discord = require("discord.js");
const settings = require("../../utils/settings.json")

module.exports = {
    name: "typowanie",
    data: new SlashCommandBuilder()
        .setName('typowanie')
        .setDescription('Pokazuje twoje typowania')

        .setDMPermission(false)
        .setDefaultMemberPermissions(discord.PermissionFlagsBits.Administrator),

    run: async (client, interaction) => {
        await interaction.deferReply({ ephemeral: true });


        const predictions = await predictionSchema.find({ guildId: interaction.guild.id, userId: interaction.user.id });

        if (predictions.length === 0) {
            return interaction.editReply({
                embeds: [
                    new discord.EmbedBuilder()
                        .setTitle("Typowanie")
                        .setColor(settings.color_red)
                        .setDescription("Nie posiadam żadnych informacji o twoich typowaniach, najpierw wpisz \`/typuj-event\` i spróbuj ponownie!")
                ]
            });
        }

        const embed = new discord.EmbedBuilder()
            .setTitle("Typowanie")
            .setColor(settings.color_green)

        let description = "Oto mecze które typujesz:\n\n";

        for (const predictedMatch of predictions) {
            let predictStatus = "";

            if (predictedMatch.checked) {
                predictStatus = predictedMatch.points > 0 ? `✅ (**${predictedMatch.points}** pkt) ` : `❌ (**${predictedMatch.points}** pkt) `
            }

            description += `- ${predictStatus}${predictedMatch.matchTitle} \`${predictedMatch.matchScore.firstScore}:${predictedMatch.matchScore.secondScore}\`\n`

            for (let i = 0; i < predictedMatch.mapScores.length; i++) {
                description += `  * Mapa #${i + 1} \`${predictedMatch.mapScores[i].firstScore}:${predictedMatch.mapScores[i].secondScore}\`\n`
            }
        }

        embed.setDescription(description);

        return interaction.editReply({ embeds: [embed] });

    }
};
