// commands/addEvent.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const { eventSchema } = require('../../models/Event'); // Model dla wydarzenia

module.exports = {
    name: "dodaj-event",
    data: new SlashCommandBuilder()
        .setName('dodaj-event')
        .setDescription('Dodaj wydarzenie z vlr.gg do bazy danych')
        .addStringOption(option =>
            option.setName('link-eventu')
                .setDescription('Podaj link do wydarzenia vlr.gg')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('link-meczy')
                .setDescription('Podaj link do meczy vlr.gg')
                .setRequired(true)),
    run: async (client, interaction) => {
        await interaction.deferReply({ ephemeral: true });

        const eventLink = interaction.options.getString('link-eventu');

        try {
            // Pobierz dane z API webscrapingu
            const response = await axios.get(`${process.env.VLR_SCRAPPER_API}/event?url=${eventLink}`);
            const eventData = response.data;

            if (!eventData || eventData.error) {
                return interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('Błąd')
                            .setColor('#FF0000')
                            .setDescription('Nie udało się znaleźć wydarzenia pod tym linkiem.')
                    ]
                });
            }

            // Sprawdź, czy wydarzenie już istnieje
            const eventMatchesLink = interaction.options.getString('link-meczy');

            const response2 = await axios.get(`${process.env.VLR_SCRAPPER_API}/matches/upcoming?url=${eventMatchesLink}`);
            const upcomingMatchesFromEvent = response2.data;

            const bracket = await axios.get(`${process.env.VLR_SCRAPPER_API}/bracket?url=${eventLink}`);
            const bracketData = bracket.data;

            if (!bracketData || bracketData.error) {
                return interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('Błąd')
                            .setColor('#FF0000')
                            .setDescription('Nie udało się znaleźć meczy pod tym linkiem!')
                    ]
                });
            }

            //const eventId = 
            const eventId = eventData.event_url.split("/")[4];

            let existingEvent = await eventSchema.findOne({ eventId });

            if (existingEvent) {
                return interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('Wydarzenie już istnieje')
                            .setColor('#FF0000')
                            .setDescription(`Wydarzenie o ID \`${eventId}\` już istnieje w bazie danych.`)
                    ]
                });
            }

            // Dodaj wydarzenie do bazy danych
            const newEvent = new eventSchema({
                guildId: interaction.guild.id,
                eventId, // ID wydarzenia
                name: eventData.event_name, // Nazwa wydarzenia
                url: eventLink, // Link do wydarzenia
                matchesUrl: eventMatchesLink,
                bracketContainers: bracketData
            });

            await newEvent.save();

            return interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle('Wydarzenie dodane')
                        .setColor('#00FF00')
                        .setDescription(`Dodano wydarzenie: \`${eventData.event_name}\` o ID \`${eventId}\` do bazy danych!`)
                ]
            });
        } catch (error) {
            console.error(error);
            return interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle('Błąd')
                        .setColor('#FF0000')
                        .setDescription('Wystąpił błąd podczas dodawania wydarzenia.')
                ]
            });
        }
    }
};
