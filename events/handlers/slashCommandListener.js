const ownerID = process.env.OWNER_ID.split(",")
const { getGuildSettings } = require("../../utils/guild");

const { PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'interactionCreate',
    once: false,
    async run(client, interaction) {
        if (!interaction.isChatInputCommand()) return;
        if (interaction.user.bot) return;

        let command = client.slashCommandsCollection.get(interaction.commandName);
        if (!command) return;

        const guildSettings = await getGuildSettings(client, interaction.guild.id);

        if (guildSettings.access == "owners") {
            if (!ownerID.includes(interaction.member.id)) return interaction.reply({ content: "Aktualnie bot jest w trakcie konserwacji! Spróbuj ponownie później!", ephemeral: true })
        } else if (guildSettings.access == "admins") {
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) return interaction.reply({ content: "Aktualnie bot jest w trakcie konserwacji! Spróbuj ponownie później!", ephemeral: true })
        }

        command.run(client, interaction)
    }
}