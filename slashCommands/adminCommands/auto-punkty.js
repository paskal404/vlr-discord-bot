const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { autoPointsSchema } = require("../../models/autoPoints.js");
const autoPoints = require("../../utils/autoPoints.js")

module.exports = {
    name: "auto-punkty",
    data: new SlashCommandBuilder()
        .setName("auto-punkty")
        .setDescription("Panel auto-punktów")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)

        // .addSubcommand(subcommand => //ustaw przypominajke
        //     subcommand
        //         .setName('sprawdź-punkty')
        //         .setDescription("Sprawdza dane z bazy dotyczace danego dnia")
        //         .addStringOption(option => option
        //             .setName('data')
        //             .setDescription("Podaj date w formacie YYYY-MM-DD")
        //             .setRequired(true)))

        .addSubcommand(subcommand => //ustaw przypominajke
            subcommand
                .setName('ustaw-kanał-punktów')
                .setDescription("Ustawia auto-punkty na danym kanale")
                .addChannelOption(option => option
                    .setName('kanał')
                    .setDescription("Podaj kanał, na którym mają się odświeżać punkty")
                    .addChannelTypes(ChannelType.GuildText)
                    .setRequired(true)))

        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    run: async (client, interaction) => {
        try {
			await interaction.deferReply({ ephemeral: true });

            const subCommand = interaction.options.getSubcommand()

            const guild = interaction.guild;

            /*if (subCommand === "sprawdź_statystyki") {
                 const type = interaction.options.getString("typ_danych");
                 const date = interaction.options.getString("data");
 
                 const formattedDate = moment.tz(`${date} 00:00:00`, 'Europe/Warsaw');
 
                 let response;
 
                 if (type === "dzienne_tekstowe") {
                     response = await autoStatistics.calculateDailyChatStatistics(guild, formattedDate);
                 } else if (type === "tygodniowe_tekstowe") {
                     response = await autoStatistics.calculateWeeklyChatStatistics(guild, formattedDate);
                 } else if (type === "dzienne_głosowe") {
                     response = await autoStatistics.calculateDailyVoiceStatistics(guild, formattedDate);
                 } else if (type === "tygodniowe_głosowe") {
                     response = await autoStatistics.calculateWeeklyVoiceStatistics(guild, formattedDate);
                 } else if (type === "klanowe_tekstowe") {
                     response = await autoStatistics.calculateWeeklyClanChatStatistics(guild, formattedDate);
                 } else if (type === "klanowe_głosowe") {
                     response = await autoStatistics.calculateWeeklyClanVoiceStatistics(guild, formattedDate);
                 }
 
                 interaction.reply(response.newMessage);
 
 
             } else */
            if (subCommand === "ustaw-kanał-punktów") {
                const channel = interaction.options.getChannel("kanał");

                await autoPointsSchema.updateOne({ guildId: guild.id }, { topPointsChannelId: channel.id }, { upsert: true });

				await autoPoints.sendAllTimePredictionStatistics(guild, channel);
                await autoPoints.sendWeeklyPredictionStatistics(guild, channel);

                return interaction.editReply({ content: "Pomyślnie skonfigurowano!", ephemeral: true, });
            }
        } catch (err) {
            console.log(err)
            return interaction.reply({
                ephemeral: false,
                content: `Błąd! Skontaktuj się z developerem!`
            })
        }
    }
};