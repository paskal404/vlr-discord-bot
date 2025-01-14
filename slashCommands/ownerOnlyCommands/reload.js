const discord = require("discord.js");
const fs = require("node:fs");

const { Routes } = require('discord-api-types/v10');

const mongoose = require("mongoose")

const settings = require("../../utils/settings.json");

module.exports = {
    name: "reload",
    data: new discord.SlashCommandBuilder()

        .setName("reload")
        .setDescription("Komenda służąca do reloadowania assetów")

        .addSubcommand(subcommand =>
            subcommand
                .setName('events')
                .setDescription("Reloaduje eventy")
        )

        .addSubcommand(subcommand =>
            subcommand
                .setName('commands')
                .setDescription("Reloaduje komendy")
        )

        .addSubcommand(subcommand =>
            subcommand
                .setName('slash-commands')
                .setDescription("Reloaduje komendy slash")
        )

        .addSubcommand(subcommand =>
            subcommand
                .setName('models')
                .setDescription("Reloaduje schematy bazodanowe")
        )

        .addSubcommand(subcommand =>
            subcommand
                .setName('file')
                .setDescription("Reloaduje plik")

                .addStringOption(option => option
                    .setName("file_name")
                    .setDescription("Podaj nazwę panelu, który chcesz zreloadować")
                    .setAutocomplete(true)
                    .setRequired(true))
        )

        .setDMPermission(false)
        .setDefaultMemberPermissions(discord.PermissionFlagsBits.Administrator),

    async autocomplete(interaction) {
        const focusedOption = interaction.options.getFocused(true);
        const focusedValue = interaction.options.getFocused();

        if (focusedOption.name === 'file_name') {
            let fileNames = [];

            const files = fs.readdirSync(`./utils`);

            for (let file of files) {
                fileNames.push(file);
            }

            fileNames = fileNames.slice(0, 25).filter(choice => choice.startsWith(focusedValue));

            return interaction.respond(
                fileNames.map(event => ({ name: event, value: event })),
            );
        }
    },
    run: async (client, interaction) => {
        const subCommand = interaction.options.getSubcommand();

        await interaction.deferReply({ ephemeral: true });

        const time1 = Date.now();

        if (subCommand === "events") {
            for (const [eventKey, eventObject] of client.events) {
                client.removeListener(eventKey, eventObject);
            }

            fs.readdirSync("./events").forEach(dir => {
                const events = fs.readdirSync(`./events/${dir}/`).filter(file => file.endsWith(".js"))

                for (let file of events) {
                    delete require.cache[require.resolve(`../../events/${dir}/${file}`)];
                }

            });

            client.events.delete();

            client._events = [];

            client.readyIntervals.forEach((interval) => {
                clearInterval(interval);
            });

            client.loadEvents();

            client.emit("ready");

            const time2 = Date.now();
            const diff = time2 - time1;

            interaction.editReply({
                embeds: [
                    new discord.EmbedBuilder()
                        .setTitle("Eventy zostały przeładowane")
                        .setDescription(`${settings.emoji_success} Pomyślnie przeładowano wszystkie eventy w ${diff}ms`)
                        .setColor(settings.color_green)
                ]
            });

        } else if (subCommand === "models") {

            mongoose.models = {};

            const models = fs.readdirSync(`./models`).filter(file => file.endsWith(".js"));

            for (let file of models) {
                delete require.cache[require.resolve(`../../models/${file}`)];
            }

            const time2 = Date.now();
            const diff = time2 - time1;

            interaction.editReply({
                embeds: [
                    new discord.EmbedBuilder()
                        .setTitle("Schematy zostały przeładowane")
                        .setDescription(`${settings.emoji_success} Pomyślnie przeładowano schematy w ${diff}ms`)
                        .setColor(settings.color_green)
                ]
            });

        } else if (subCommand === "commands") {

            fs.readdirSync("./commands").forEach(dir => {
                const commands = fs.readdirSync(`./commands/${dir}/`).filter(file => file.endsWith(".js"))

                for (let file of commands) {
                    delete require.cache[require.resolve(`../../commands/${dir}/${file}`)];
                }

            });

            client.commands.delete();
            client.alliases.delete();

            client.loadCommands();

            const time2 = Date.now();
            const diff = time2 - time1;

            interaction.editReply({
                embeds: [
                    new discord.EmbedBuilder()
                        .setTitle("Komendy zostały przeładowane")
                        .setDescription(`${settings.emoji_success} Pomyślnie przeładowano wszystkie komendy w ${diff}ms`)
                        .setColor(settings.color_green)
                ]
            });
        } else if (subCommand === "slash-commands") {
            fs.readdirSync("./slashCommands").forEach(dir => {
                const slashCommands = fs.readdirSync(`./slashCommands/${dir}/`).filter(file => file.endsWith(".js"))

                for (let file of slashCommands) {
                    delete require.cache[require.resolve(`../../slashCommands/${dir}/${file}`)];
                }

            });

            client.slashCommandsArray = [];
            client.slashCommandsCollection.delete();

            client.loadSlashCommands();

            const time2 = Date.now();
            const diff = time2 - time1;

            client.rest.put(
                Routes.applicationCommands(process.env.CLIENT_ID),
                { body: client.slashCommandsArray },
            );

            interaction.editReply({
                embeds: [
                    new discord.EmbedBuilder()
                        .setTitle("Komendy slash zostały przeładowane")
                        .setDescription(`${settings.emoji_success} Pomyślnie przeładowano wszystkie komendy slash w ${diff}ms`)
                        .setColor(settings.color_green)
                ]
            });
        } else if (subCommand === "file") {
            const fileName = interaction.options.getString("file_name");

            delete require.cache[require.resolve(`../../utils/${fileName}`)];

            const time2 = Date.now();
            const diff = time2 - time1;

            interaction.editReply({
                embeds: [
                    new discord.EmbedBuilder()
                        .setTitle("Plik został przeładowany")
                        .setDescription(`${settings.emoji_success} Pomyślnie przeładowano plik \`${fileName}\` w ${diff}ms`)
                        .setColor(settings.color_green)
                ]
            });
        }
    }
}