const { Routes } = require('discord-api-types/v10');

module.exports = {
    name: 'ready',
    once: false,
    async run(client) {
        try {
            await client.rest.put(
                Routes.applicationCommands("1298229411862024254"),
                { body: client.slashCommandsArray },
            );
    
        } catch (error) {
            console.error(error);
        }
    }
}