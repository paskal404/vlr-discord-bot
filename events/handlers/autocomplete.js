module.exports = {
    name: 'interactionCreate',
    once: false,
    async run(client, interaction) {
        if (interaction.isAutocomplete()) {
            const command = interaction.client.slashCommandsCollection.get(interaction.commandName);

            if (!command) {
                return;
            }

            try {
                await command.autocomplete(interaction);
            } catch (error) {
                console.error(error);
            }
        }
    },
};