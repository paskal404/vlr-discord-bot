const { eventSchema } = require("../../models/Event");
const axios = require('axios');

const discord = require("discord.js")

const { createCanvas, loadImage } = require('canvas');

async function renderBracketGraphic(bracketData) {
    const canvasWidth = 1920;
    const canvasHeight = 1080;
    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext('2d');

    // Set background color
    ctx.fillStyle = '#181818'; // Dark background
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Bracket rendering settings
    const rowHeight = 150;           // Height of each match row
    const columnWidth = 300;         // Width of each match column
    const marginX = 50;              // Margin between columns
    const marginY = 20;              // Margin between rows within a column

    // Set initial Y position
    let startY = 50;

    // Loop through each container in the bracketData
    for (let container of bracketData) {

        const groupedByColumns = container.matches.reduce((acc, match) => {
            // If the column doesn't exist in the accumulator, create an empty array
            if (!acc[match.column]) {
                acc[match.column] = [];
            }
            // Push the match to the correct column group
            acc[match.column].push(match);
            return acc;
        }, {});

        let mostMatches = 0;
        let ColumnWithMostMatches = null;

        // Find the column with the most matches
        for (let kolumna in groupedByColumns) {
            const matchesInColumn = groupedByColumns[kolumna];
            if (matchesInColumn.length > mostMatches) {
                mostMatches = matchesInColumn.length;
                ColumnWithMostMatches = kolumna;
            }
        }

        for (let column in groupedByColumns) {
            const matchesInColumn = groupedByColumns[column];


            // Determine the start position for the current column
            const startX = marginX + column * (columnWidth); // Adjust the column start position

            for (let index = 0; index < matchesInColumn.length; index++) {
                const match = matchesInColumn[index];

                let additionalY = 0;

                if (matchesInColumn.length < mostMatches) {
                    additionalY = additionalY + (index * rowHeight) + (rowHeight / 2);
                }

                if (matchesInColumn.length == 1) {
                    let maxH = 0;

                    for (let i = 0; i < mostMatches; i++) {
                        maxH = maxH + rowHeight;
                    }

                    additionalY = (maxH / 2) - (rowHeight / 2);
                }

                if (index == 0) {
                    ctx.fillStyle = '#FFFFFF';
                    ctx.font = 'bold 16px Arial';
                    ctx.fillText(matchesInColumn[index].columnName, startX, additionalY + startY + index * (rowHeight) - 5);
                }

                // Draw the match background rectangle
                ctx.fillStyle = '#353535';
                ctx.fillRect(startX, additionalY + startY + index * (rowHeight), columnWidth - 10, rowHeight - marginY);

                for (const [teamIndex, team] of match.teams.entries()) {
                    const teamY = ((75/2) + 8) + additionalY + startY + index * (rowHeight) + teamIndex * 50; // Change 50 to the desired gap

                    // Display team name and score
                    ctx.fillStyle = '#FFFFFF';
                    ctx.font = 'bold 16px Arial';
                    ctx.fillText(`${team.name} (${team.score})`, startX, teamY);
    
                    if (team.img) {
                        try {
                            const img = await loadImage(team.img);
                            if (img) {
                                ctx.drawImage(img, startX + columnWidth - 40, teamY - 10, 30, 30);
                            }
                        } catch (err) {
                            console.error('Error loading image:', err);
                        }
                    }
                }
            
            };
        }
        startY = startY + 700;

        
    }

    const buffer = canvas.toBuffer('image/png');

    return buffer; // Return the image buffer
}

module.exports = {
    name: 'ready',
    once: true,
    execute(client) {
        async function checkServer(guild) {
            const events = await eventSchema.find({ guildId: guild.id });

            for (const event of events) {
                const response = await axios.get(`${process.env.VLR_SCRAPPER_API}/event?url=${event.url}`);
                const eventData = response.data;

                const response2 = await axios.get(`${process.env.VLR_SCRAPPER_API}/matches/upcoming?url=${event.matchesUrl}`);
                const upcomingMatchesFromEvent = response2.data;

                const bracket = await axios.get(`${process.env.VLR_SCRAPPER_API}/bracket?url=${event.url}`);
                const bracketData = bracket.data;

                const eventUrl = event.url;
                const buffer = await renderBracketGraphic(bracketData);

                const attachment = new discord.AttachmentBuilder(Buffer.from(buffer));
                attachment.name = 'bracket.png';

                const channel = guild.channels.cache.get("1298244042903261284");
                if (channel) channel.send({ files: [attachment] });
            }
        }

        async function checkServers() {
            const guilds = Array.from(client.guilds.cache.values());

            for (const guild of guilds) {
                await checkServer(guild);
            }
        }

        checkServers();
        const newInterval = setInterval(checkServers, 1000 * 60 * 5);
        client.readyIntervals.push(newInterval);

    },
};