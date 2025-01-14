const { Routes } = require('discord-api-types/v10');

module.exports = {
    name: 'ready',
    once: false,
    async run(client) {
        try {
            await client.rest.put(
                Routes.applicationCommands(process.env.CLIENT_ID),
                { body: client.slashCommandsArray },
            );
    
        } catch (error) {
            console.error(error);
        }
    }
}