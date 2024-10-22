const { PermissionsBitField } = require("discord.js");
const { getGuildSettings } = require("../../utils/guild");

// const lastMessageDate = {}

module.exports = {
    name: 'messageCreate',
    once: false,
    async run(client, message) {
        const { guild, content } = message;
        if (message.author.bot || !message.guild) return;

        const guildSettings = await getGuildSettings(client, guild.id);

        if (!content.startsWith(guildSettings.prefix)) return;

        // if (!lastMessageDate[message.member.id]) {
        //     lastMessageDate[message.member.id] = Date.now()
        // } else if (Date.now() < lastMessageDate[message.member.id] + 1000) return; //if time between previous message and actual message is smaller than 1s, then command would not start
        // lastMessageDate[message.member.id] = Date.now()

        const args = content.slice(guildSettings.prefix.length).trim().split(/ +/g);
        const cmd = args.shift().toLowerCase();

        if (cmd.length === 0) return;
        let command = client.commands.get(cmd);
        if (!command) command = client.commands.get(client.alliases.get(cmd));
        if (!command) return;

        if (guildSettings.access === "owners") {
            if (!ownerID.includes(message.author.id)) return message.reply({ content: "Aktualnie bot jest w trakcie konserwacji! Spróbuj ponownie później!" })
        } else if (guildSettings.access === "admins") {
            if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return message.reply({ content: "Aktualnie bot jest w trakcie konserwacji! Spróbuj ponownie później!" })
        }

        command.run(client, message, args)

    },
};