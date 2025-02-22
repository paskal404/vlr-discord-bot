const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const axios = require('axios');
const { eventSchema } = require('../../models/Event');
const settings = require("../../utils/config.json");

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
                .setRequired(true))

                .setDMPermission(false)
                .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
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
                            .setTitle('Dodawanie eventu')
                            .setColor(settings.color_red)
                            .setDescription('Nie udało się znaleźć eventu pod tym linkiem.')
                    ]
                });
            }

            // Sprawdź, czy wydarzenie już istnieje
            const eventMatchesLink = interaction.options.getString('link-meczy');

            // const response2 = await axios.get(`${process.env.VLR_SCRAPPER_API}/matches/upcoming?url=${eventMatchesLink}`);
            // const upcomingMatchesFromEvent = response2.data;

            // const response2 = await axios.get(`${process.env.VLR_SCRAPPER_API}/matches/all?url=${eventMatchesLink}`);
            // const allMatches = response2.data;

            // console.log(upcomingMatchesFromEvent)

            const bracket = await axios.get(`${process.env.VLR_SCRAPPER_API}/bracket?url=${eventLink}`);
            const bracketData = bracket.data;

            if (!bracketData || bracketData.error) {
                return interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('Dodawanie eventu')
                            .setColor(settings.color_red)
                            .setDescription('Nie udało się znaleźć meczy pod tym linkiem!')
                    ]
                });
            }

            const eventId = eventData.event_url.split("/")[4];

            let existingEvent = await eventSchema.findOne({ eventId });

            if (existingEvent) {
                return interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('Dodawanie eventu')
                            .setColor(settings.color_red)
                            .setDescription(`Event o ID \`${eventId}\` już istnieje w bazie danych.`)
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
                matches: [],
                bracketContainers: bracketData,
                status: "unchecked",
            });

            await newEvent.save();

            return interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle('Dodawanie eventu')
                        .setColor(settings.color_green)
                        .setDescription(`Dodano event \`${eventData.event_name}\` o ID \`${eventId}\` do bazy danych!`)
                ]
            });
        } catch (error) {
            console.error(error);
            return interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle('Dodawanie eventu')
                        .setColor(settings.color_red)
                        .setDescription('Wystąpił błąd podczas dodawania eventu.')
                ]
            });
        }
    }
};
