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

        .addSubcommand(subcommand =>
            subcommand
                .setName('sprawdź-punkty')
                .setDescription("Pokazuje leaderboard punktów")
                .addStringOption(option => option
                    .setName('typ')
                    .setDescription("Wybierz typ leaderboardu")
                    .addChoices(
                        { name: 'Tygodniowe punkty', value: 'weekly' },
                        { name: 'Punkty ogółem', value: 'alltime' }
                    )
                    .setRequired(true))
                .addIntegerOption(option => option
                    .setName('tygodnie-wstecz')
                    .setDescription("Ile tygodni wstecz sprawdzić (tylko dla tygodniowych punktów)")
                    .setMinValue(0)
                    .setMaxValue(52)
                    .setRequired(false)))

        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    run: async (client, interaction) => {
        try {
            const subCommand = interaction.options.getSubcommand()

            // For leaderboard, make it public; for setup, keep it private
            const isLeaderboard = subCommand === "sprawdź-punkty";
			await interaction.deferReply({ ephemeral: !isLeaderboard });

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

                return interaction.editReply({ content: "Pomyślnie skonfigurowano!" });
            } else if (subCommand === "sprawdź-punkty") {
                const typ = interaction.options.getString("typ");
                const weeksBack = interaction.options.getInteger("tygodnie-wstecz") || 0;
                const moment = require("moment-timezone");
                
                let response;

                if (typ === "weekly") {
                    // Calculate the date for the requested week
                    const date = moment().tz('Europe/Warsaw').subtract(weeksBack, 'weeks');
                    
                    response = await autoPoints.calculateWeeklyPredictionPoints(guild, date);
                    
                    // Modify the title to show which week we're looking at
                    if (weeksBack > 0) {
                        const weekText = weeksBack === 1 ? "tydzień temu" : `${weeksBack} tygodni temu`;
                        response.newMessage.embeds[0].title = `Statystyki tygodniowe typowania (${weekText})`;
                    }
                    
                    return interaction.editReply(response.newMessage);
                } else if (typ === "alltime") {
                    // Weeks back doesn't apply to all-time stats
                    if (weeksBack > 0) {
                        return interaction.editReply({
                            content: "Parametr 'tygodnie-wstecz' nie ma zastosowania dla statystyk ogólnych."
                        });
                    }
                    
                    const date = moment().tz('Europe/Warsaw');
                    response = await autoPoints.calculateAllTimePredictionPoints(guild, date);
                    return interaction.editReply(response.newMessage);
                }
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