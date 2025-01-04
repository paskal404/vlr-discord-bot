const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { eventSchema } = require('../../models/Event'); // Model dla wydarzenia
const { predictionSchema } = require('../../models/Prediction'); // Model dla wydarzenia
const discord = require("discord.js");
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
            option.setName('wynik-1-mapy')
                .setDescription('Podaj wynik w formacie X:X np 13:1')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('wynik-2-mapy')
                .setDescription('Podaj wynik w formacie X:X np 13:1')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('wynik-3-mapy')
                .setDescription('Podaj wynik w formacie X:X np 13:1')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('wynik-4-mapy')
                .setDescription('Podaj wynik w formacie X:X np 13:1')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('wynik-5-mapy')
                .setDescription('Podaj wynik w formacie X:X np 13:1')
                .setRequired(false))

        .setDMPermission(false)
        .setDefaultMemberPermissions(discord.PermissionFlagsBits.Administrator),

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

            let event = await eventSchema.findOne({ guildId: interaction.guild.id, eventId });

            if (!event) event = await eventSchema.findOne({ guildId: interaction.guild.id, name: eventId });

            if (!event) return;

            const matches = event.matches;

            // let matches = [];

            // for (let i = 0; i < event.bracketContainers.length; i++) {
            //     for (let j = 0; j < event.bracketContainers[i].matches.length; j++) {
            //         matches.push(event.bracketContainers[i].matches[j]);
            //     }
            // }

            const filtered = matches.filter(match => `${match.team_one_name} vs. ${match.team_two_name}`.startsWith(focusedOption.value) && !`${match.team_one_name} vs. ${match.team_two_name}`.includes("TBD"));

            interaction.respond(
                filtered.map(match => ({ name: `${match.team_one_name} vs. ${match.team_two_name}`, value: `${match.team_one_name} vs. ${match.team_two_name}` })),
            );

            return;
        }
    },
    run: async (client, interaction) => {
        await interaction.deferReply({ ephemeral: true });

        const eventId = interaction.options.getString('event');
        const matchTitle = interaction.options.getString('mecz');

        let event = await eventSchema.findOne({ guildId: interaction.guild.id, eventId });

        if (!event) {
            event = await eventSchema.findOne({ guildId: interaction.guild.id, name: eventId });

            if (!event) {
                return interaction.editReply({
                    embeds: [
                        new discord.EmbedBuilder()
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
                    new discord.EmbedBuilder()
                        .setTitle("Typowanie")
                        .setColor(settings.color_red)
                        .setDescription("Już typujesz ten mecz")
                ]
            })
        }

        const score = interaction.options.getString('wynik-meczu').split(":");

        const firstMapScore = interaction.options.getString('wynik-1-mapy') ? interaction.options.getString('wynik-1-mapy').split(":") : false;
        const secondMapScore = interaction.options.getString('wynik-2-mapy') ? interaction.options.getString('wynik-2-mapy').split(":") : false;
        const thirdMapScore = interaction.options.getString('wynik-3-mapy') ? interaction.options.getString('wynik-3-mapy').split(":") : false;
        const fourthMapScore = interaction.options.getString('wynik-4-mapy') ? interaction.options.getString('wynik-4-mapy').split(":") : false;
        const fiveMapScore = interaction.options.getString('wynik-5-mapy') ? interaction.options.getString('wynik-5-mapy').split(":") : false;

        try {
            // Validate and parse the main score
            var [firstScore, secondScore] = parseAndValidateScore(score);

            // Validate and parse each map score
            if (firstMapScore) {
                var [firstMapFirstScore, firstMapSecondScore] = parseAndValidateScore(firstMapScore);
            }

            if (secondMapScore) {
                var [secondMapFirstScore, secondMapSecondScore] = parseAndValidateScore(secondMapScore);
            }

            if (thirdMapScore) {
                var [thirdMapFirstScore, thirdMapSecondScore] = parseAndValidateScore(thirdMapScore);
            }

            if (fourthMapScore) {
                var [fourthMapFirstScore, fourthMapSecondScore] = parseAndValidateScore(fourthMapScore);
            }

            if (fiveMapScore) {
                var [fiveMapFirstScore, fiveMapSecondScore] = parseAndValidateScore(fiveMapScore);
            }


            // Now you have all scores as numbers

        } catch (error) {
            return interaction.editReply({
                embeds: [
                    new discord.EmbedBuilder()
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
                    new discord.EmbedBuilder()
                        .setTitle("Typowanie")
                        .setColor(settings.color_red)
                        .setDescription("Nie znaleziono podanego meczu!")
                ]
            })
        }

        if (match.status !== "upcoming") {
            return interaction.editReply({
                embeds: [
                    new discord.EmbedBuilder()
                        .setTitle("Typowanie")
                        .setColor(settings.color_red)
                        .setDescription("Nie możesz typować meczu, który już się skończył, lub dopiero zaczął!")
                ]
            })
        }

        // let matches = [];

        // for (let i = 0; i < event.bracketContainers.length; i++) {
        //     for (let j = 0; j < event.bracketContainers[i].matches.length; j++) {
        //         matches.push(event.bracketContainers[i].matches[j]);
        //     }
        // }

        // const match = matches.find((match) => match.title === matchTitle);

        // if (Math.trunc(Date.now() / 1000) > match.status) {
        //     return interaction.editReply({
        //         embeds: [
        //             new discord.EmbedBuilder()
        //                 .setTitle("Obstawianie")
        //                 .setColor(settings.color_red)
        //                 .setDescription("Nie możesz obstawić meczu, który już się skończył, lub dopiero zaczął!")
        //         ]
        //     })
        // }

        let predictionObject = { guildId: interaction.guild.id, userId: interaction.user.id, eventId: event.eventId, matchTitle, matchScore: { firstScore, secondScore }, checked: false, mapScores: [], createdAt: Date.now() };

        if (firstScore > secondScore) {
            predictionObject.predictedOutcome = "firstTeamWin";
        } else if (firstScore === secondScore) {
            predictionObject.predictedOutcome = "draw";
        } else if (firstScore < secondScore) {
            predictionObject.predictedOutcome = "secondTeamWin";
        }

        if (firstMapScore) {
            predictionObject.mapScores.push({ firstScore: firstMapFirstScore, secondScore: firstMapSecondScore });
        }
        if (secondMapScore) {
            predictionObject.mapScores.push({ firstScore: secondMapFirstScore, secondScore: secondMapSecondScore });
        }
        if (thirdMapScore) {
            predictionObject.mapScores.push({ firstScore: thirdMapFirstScore, secondScore: thirdMapSecondScore });
        }
        if (fourthMapScore) {
            predictionObject.mapScores.push({ firstScore: fourthMapFirstScore, secondScore: fourthMapSecondScore });
        }
        if (fiveMapScore) {
            predictionObject.mapScores.push({ firstScore: fiveMapFirstScore, secondScore: fiveMapSecondScore });
        }

        await new predictionSchema(predictionObject).save();

        return interaction.editReply({
            embeds: [
                new discord.EmbedBuilder()
                    .setTitle("Typowanie")
                    .setColor(settings.color_green)
                    .setDescription(`Pomyślnie typujesz mecz \`${match.team_one_name} vs. ${match.team_two_name}\` z wynikiem \`${interaction.options.getString('wynik-meczu')}\``)
            ]
        });

    }
};
