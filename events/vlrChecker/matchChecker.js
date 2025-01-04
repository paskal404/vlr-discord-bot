// const { eventSchema } = require("../../models/Event");
// const axios = require('axios');

// const discord = require("discord.js")

// const { createCanvas, loadImage } = require('canvas');

// module.exports = {
//     name: 'ready',
//     once: true,
//     execute(client) {
//         async function checkServer(guild) {
//             const events = await eventSchema.find({ guildId: guild.id });

//             for (const event of events) {
//                 for (const container of event.bracketContainers) {
//                     for (const match of container.matches) {
//                         console.log(`${process.env.VLR_SCRAPPER_API}/match?url=${match.link}`)
//                         const response = await axios.get(`${process.env.VLR_SCRAPPER_API}/match?url=${match.link}`);
//                         const eventData = response.data;

        
//                         const eventUrl = event.url;
//                         const buffer = await renderBracketGraphic(bracketData);
        
//                         const attachment = new discord.AttachmentBuilder(Buffer.from(buffer));
//                         attachment.name = 'bracket.png';
        
//                         const channel = guild.channels.cache.get("1298244042903261284");
//                         if (channel) channel.send({ files: [attachment] });
//                     }
//                 }
//             }
//         }

//         async function checkServers() {
//             const guilds = Array.from(client.guilds.cache.values());

//             for (const guild of guilds) {
//                 await checkServer(guild);
//             }
//         }

//         checkServers();
//         const newInterval = setInterval(checkServers, 1000 * 60 * 5);
//         client.readyIntervals.push(newInterval);

//     },
// };