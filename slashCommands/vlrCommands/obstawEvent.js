// commands/addEvent.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const { eventSchema } = require('../../models/Event'); // Model dla wydarzenia
const { predictionSchema } = require('../../models/Prediction'); // Model dla wydarzenia
const discord = require("discord.js");

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
    name: "obstaw-mecz",
    data: new SlashCommandBuilder()
        .setName('obstaw-mecz')
        .setDescription('Obstawia wynik')
        .addStringOption(option =>
            option.setName('event')
                .setDescription('Podaj event')
                .setAutocomplete(true)
                .setRequired(true))
        .addStringOption(option =>
            option.setName('mecz')
                .setDescription('Podaj mecz jaki chcesz obstawić')
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
                .setRequired(false)),

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

            const event = await eventSchema.findOne({ guildId: interaction.guild.id, eventId });

            let matches = [];

            for (let i = 0; i < event.bracketContainers.length; i++) {
                for (let j = 0; j < event.bracketContainers[i].matches.length; j++) {
                    matches.push(event.bracketContainers[i].matches[j]);
                }
            }

            const filtered = matches.filter(match => match.title.startsWith(focusedOption.value) && !match.title.includes("TBD"));

            interaction.respond(
                filtered.map(match => ({ name: match.title, value: match.title })),
            );

            return;
        }
    },
    run: async (client, interaction) => {
        await interaction.deferReply({ ephemeral: true });


        const eventId = interaction.options.getString('event');
        const matchTitle = interaction.options.getString('mecz');

        const alreadyPredicted = await predictionSchema.findOne({ guildId: interaction.guild.id, userId: interaction.user.id, eventId, matchTitle });

        if (alreadyPredicted) {
            return interaction.editReply({
                embeds: [
                    new discord.EmbedBuilder()
                        .setTitle("Obstawianie")
                        .setDescription("Już obstawiłeś ten mecz")
                ]
            })
        }

        const score = interaction.options.getString('wynik-meczu').split(":");

        const firstMapScore = interaction.options.getString('wynik-1-mapy').split(":");
        const secondMapScore = interaction.options.getString('wynik-2-mapy').split(":");
        const thirdMapScore = interaction.options.getString('wynik-3-mapy').split(":");

        try {
            // Validate and parse the main score
            var [firstScore, secondScore] = parseAndValidateScore(score);

            // Validate and parse each map score
            var [firstMapFirstScore, firstMapSecondScore] = parseAndValidateScore(firstMapScore);
            var [secondMapFirstScore, secondMapSecondScore] = parseAndValidateScore(secondMapScore);
            var [thirdMapFirstScore, thirdMapSecondScore] = parseAndValidateScore(thirdMapScore);

            // Now you have all scores as numbers

        } catch (error) {
            return interaction.editReply({
                embeds: [
                    new discord.EmbedBuilder()
                        .setTitle("Obstawianie")
                        .setDescription("Podaj wynik w formacie \`X:X\` np \`13:1\`")
                ]
            })
        }

        const event = await eventSchema.findOne({ guildId: interaction.guild.id, eventId });

        let matches = [];

        for (let i = 0; i < event.bracketContainers.length; i++) {
            for (let j = 0; j < event.bracketContainers[i].matches.length; j++) {
                matches.push(event.bracketContainers[i].matches[j]);
            }
        }

        const match = matches.find((match) => match.title === matchTitle);

        if (Math.trunc(Date.now()/1000) > match.status) {
            return interaction.editReply({
                embeds: [
                    new discord.EmbedBuilder()
                        .setTitle("Obstawianie")
                        .setDescription("nie")
                ]
            })
        }

        let predictionObject = { guildId: interaction.guild.id, userId: interaction.user.id, eventId, matchTitle, matchScore: { firstScore, secondScore }, checked: false, mapScores: [] };

        if (firstMapScore) {
            predictionObject.mapScores.push({ firstScore: firstMapFirstScore, secondScore: firstMapSecondScore })
        }
        if (secondMapScore) {
            predictionObject.mapScores.push({ firstScore: secondMapFirstScore, secondScore: secondMapSecondScore })
        }
        if (thirdMapScore) {
            predictionObject.mapScores.push({ firstScore: thirdMapFirstScore, secondScore: thirdMapSecondScore })
        }

        await new predictionSchema(predictionObject).save();

        return interaction.editReply({ content: `${event.name} - ${match.title}` });

    }
};
