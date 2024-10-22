
module.exports = {
    name: "ping",
    run: async (client, message, args) => {
        console.time("latency")
        message.channel.send(`Opóźnienie: \`${Date.now() - message.createdTimestamp}ms\`\nOpóźnienie API: \`${Math.round(client.ws.ping)}ms\``).then(m => {
            console.timeEnd("latency")
        })
    }
};