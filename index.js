const { Client, GatewayIntentBits, Partials, Collection } = require("discord.js");
const mongoose = require("mongoose");

require("dotenv").config();

const client = new Client({
    intents: [
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.DirectMessageTyping,
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildEmojisAndStickers,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildWebhooks,
        GatewayIntentBits.GuildIntegrations,
    ],
    allowedMentions: {
        parse: ['users', 'roles'],
        repliedUser: false,
    },
    autoReconnect: true,
    partials: [Partials.Channel, Partials.Message, Partials.Reaction, Partials.GuildMember, Partials.User],
});

process.on("unhandledRejection", (err) => {
    const channel = client.channels.cache.get(process.env.ERROR_LOG_CHANNEL_ID)
    if (channel) channel.send({ content: "```" + err.stack + "```" })
});

process.on("uncaughtException", (err) => {
    const channel = client.channels.cache.get(process.env.ERROR_LOG_CHANNEL_ID)
    if (channel) channel.send({ content: "```" + err.stack + "```" })
});

mongoose.connect(process.env.MONGODB_URI).then(() => {
    console.log("Connected to the database.");
}).catch((err) => {
    console.error("Failed to connect to the database:", err);
});

client.readyIntervals = [];

//######################### EVENTY ######################//
const fs = require('node:fs');

client.events = new Collection();

function loadEvents() {
    let eventCount = 0;

    fs.readdirSync("./events").forEach(dir => {

        const command = fs.readdirSync(`./events/${dir}/`).filter(file => file.endsWith(".js"));

        for (let file of command) {

            let event = require(`./events/${dir}/${file}`);

            if (event.once) {
                function callEvent(...args) {
                    event.execute(client, ...args);
                }

                client.once(event.name, callEvent);
                client.events.set(event.name, callEvent);

                eventCount++;
            } else {
                function callEvent(...args) {
                    event.run(client, ...args);
                }

                client.on(event.name, callEvent);
                client.events.set(event.name, callEvent);

                eventCount++;
            }
        }
    })

    console.log(`Załadowano ${eventCount} eventów`);
}

client.loadEvents = async () => {
    loadEvents();
}

loadEvents();
//###################### EVENTY #########################//

//###################### KOMENDY #######################//
client.commands = new Collection();
client.alliases = new Collection();

function loadCommands() {
    let commandCount = 0;
    let alliasCount = 0;

    fs.readdirSync("./commands/").forEach(dir => {
        const command = fs.readdirSync(`./commands/${dir}/`).filter(file => file.endsWith(".js"))
        for (let file of command) {
            let pulled = require(`./commands/${dir}/${file}`)
            if (pulled.name) {
                client.commands.set(pulled.name, pulled)
                commandCount++;
            }
            if (pulled.alliases && Array.isArray(pulled.alliases)) {
                pulled.alliases.forEach(alias => {
                    client.alliases.set(alias, pulled.name);
                    alliasCount++;
                })
            }
        }
    })

    console.log(`Załadowano ${commandCount} komend i ${alliasCount} aliasów`)
}

client.loadCommands = async () => {
    loadCommands();
}

loadCommands();
//###################### KOMENDY #######################//

//###################### SLASH KOMENDY #######################//
client.slashCommandsCollection = new Collection();
client.slashCommandsArray = [];

function loadSlashCommands() {
    let slashCommandCount = 0;

    fs.readdirSync("./slashCommands/").forEach(dir => {
        const command = fs.readdirSync(`./slashCommands/${dir}/`).filter(file => file.endsWith(".js"))
        for (let file of command) {
            let pulled = require(`./slashCommands/${dir}/${file}`)
            if (pulled.name) {
                client.slashCommandsArray.push(pulled.data.toJSON());
                client.slashCommandsCollection.set(pulled.name, pulled)

                slashCommandCount++;
            }
        }
    });

    console.log(`Załadowano ${slashCommandCount} komend slash`)
}

client.loadSlashCommands = async () => {
    loadSlashCommands();
}

loadSlashCommands();
//###################### SLASH KOMENDY #######################//

//###################### SETUP #######################//
// const utils = require("./util/utils");

// async function setup(){

//     await utils.setupGlobalBoosters(client);

// }
//###################### LOGIN #######################//

client.login(process.env.DISCORD_TOKEN).then(() => {
    console.log("Logged in to Discord.");
}).catch((err) => {
    console.error("Failed to log in to Discord:", err);
});