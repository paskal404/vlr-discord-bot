const { eventSchema } = require("../../models/Event");
const axios = require('axios');

const discord = require("discord.js")

const { createCanvas, loadImage } = require('canvas');

async function renderBracketGraphic(bracketData) {
    const canvasWidth = 2400;
    const canvasHeight = 1080;
    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext('2d');

    // Set background color
    ctx.fillStyle = '#181818'; // Dark background
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Bracket rendering settings
    const rowHeight = 150;           // Height of each match row
    const columnWidth = 400;         // Width of each match column
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

        const columnKeys = Object.keys(groupedByColumns);
        for (let columnIndex = 0; columnIndex < columnKeys.length; columnIndex++) {
            const column = columnKeys[columnIndex];
            const matchesInColumn = groupedByColumns[column];

            //let divider;
            let nextColumnStatus;

            // Check if there’s a next column and if it has more matches
            if (columnIndex < columnKeys.length - 1) {
                const nextColumn = columnKeys[columnIndex + 1];
                const nextColumnMatches = groupedByColumns[nextColumn].length;

                // Perform any adjustments if the next column has more matches
                if (nextColumnMatches > matchesInColumn.length) {
                    // console.log(`kolumna ${parseInt(column)+1} ma mniej meczy niz kolumna ${parseInt(nextColumn)+1}.`);
                    nextColumnStatus = 1;

                } else if (nextColumnMatches === matchesInColumn.length) {
                    // console.log(`kolumna ${parseInt(column)+1} ma tyle samo meczy co kolumna ${parseInt(nextColumn)+1}.`);
                    nextColumnStatus = 2;

                } else {
                    // console.log(`kolumna ${parseInt(column)+1} ma wiecej meczy niz kolumna ${parseInt(nextColumn)+1}.`);
                    nextColumnStatus = 3;

                }
            }

            const startX = marginX + column * columnWidth;

            for (let index = 0; index < matchesInColumn.length; index++) {
                let match = matchesInColumn[index];
                let additionalY = 0;

                if (matchesInColumn.length < mostMatches) {
                    additionalY += (index * rowHeight) + (rowHeight / 2);
                }

                if (matchesInColumn.length == 1) {
                    let maxH = 0;
                    for (let i = 0; i < mostMatches; i++) {
                        maxH += rowHeight;
                    }
                    additionalY = (maxH / 2) - (rowHeight / 2);
                }

                if (index == 0) {
                    ctx.fillStyle = '#FFFFFF';
                    ctx.font = 'bold 16px Arial';
                    ctx.fillText(matchesInColumn[index].columnName, startX, additionalY + startY + index * rowHeight - 5);
                }

                // if (nextColumnStatus === 1) {
                //     ctx.fillStyle = '#353535';
                //     ctx.strokeStyle = '#555555';
                //     ctx.beginPath();
                //     ctx.moveTo(startX + 300, additionalY + startY + index * rowHeight + 70);
                //     ctx.lineTo(startX + 350, additionalY + startY + index * rowHeight + 70);

                //     ctx.moveTo(startX + 350, additionalY + startY + index * rowHeight + 70);
                //     ctx.lineTo(startX + 350, additionalY + startY + index * rowHeight + 70 -75);

                //     ctx.moveTo(startX + 350, additionalY + startY + index * rowHeight + 70 -75);
                //     ctx.lineTo(startX + 350 + 50, additionalY + startY + index * rowHeight + 70 -75);

                //     ctx.lineWidth = 4;
                //     ctx.lineCap = "round";
                //     ctx.stroke();
                // }

                // if (nextColumnStatus === 2) {
                //     ctx.fillStyle = '#353535';
                //     ctx.strokeStyle = '#555555';
                //     ctx.beginPath();
                //     ctx.moveTo(startX + 300, additionalY + startY + index * rowHeight + 70);
                //     ctx.lineTo(startX + 400, additionalY + startY + index * rowHeight + 70);

                //     ctx.lineWidth = 4;
                //     ctx.lineCap = "round";
                //     ctx.stroke();
                // }

                // if (nextColumnStatus === 3) {
                //     if (index % 2 > 0) {
                //         ctx.fillStyle = '#353535';
                //         ctx.strokeStyle = '#555555';
                //         ctx.beginPath();
                //         ctx.moveTo(startX + 300, additionalY + startY + index * rowHeight + 70);
                //         ctx.lineTo(startX + 350, additionalY + startY + index * rowHeight + 70);

                //         ctx.moveTo(startX + 350, additionalY + startY + index * rowHeight + 70);
                //         ctx.lineTo(startX + 350, additionalY + startY + index * rowHeight + 70 - 60);

                //         ctx.moveTo(startX + 350, additionalY + startY + index * rowHeight + 70 - 60);
                //         ctx.lineTo(startX + 400, additionalY + startY + index * rowHeight + 70 - 60);

                //         ctx.lineWidth = 4;
                //         ctx.lineCap = "round";
                //         ctx.stroke();

                //     }else{
                //         ctx.fillStyle = '#353535';
                //         ctx.strokeStyle = '#555555';
                //         ctx.beginPath();
                //         ctx.moveTo(startX + 300, additionalY + startY + index * rowHeight + 70);
                //         ctx.lineTo(startX + 350, additionalY + startY + index * rowHeight + 70);

                //         ctx.moveTo(startX + 350, additionalY + startY + index * rowHeight + 70);
                //         ctx.lineTo(startX + 350, additionalY + startY + index * rowHeight + 70 + 60);

                //         ctx.moveTo(startX + 350, additionalY + startY + index * rowHeight + 70 + 60);
                //         ctx.lineTo(startX + 400, additionalY + startY + index * rowHeight + 70 + 60);

                //         ctx.lineWidth = 4;
                //         ctx.lineCap = "round";
                //         ctx.stroke();
                //     }
                // }


                ctx.strokeStyle = '#353535';
                ctx.fillStyle = '#353535';
                ctx.beginPath();
                ctx.roundRect(startX, additionalY + startY + index * rowHeight, columnWidth - 100, rowHeight - marginY, 20);
                match.yCord = (additionalY + startY + index * rowHeight)
                // match.xCord = (additionalY + startY + index * rowHeight)
                ctx.stroke();
                ctx.fill();

                for (const [teamIndex, team] of match.teams.entries()) {
                    const teamY = ((75 / 2) + 8) + additionalY + startY + index * rowHeight + teamIndex * 50;
                    ctx.fillStyle = team.isWinner ? '#4BB543' : '#FFFFFF';
                    ctx.font = 'bold 16px Arial';
                    ctx.fillText(`${team.name} (${team.score})`, startX + 5, teamY, 230);

                    if (team.img) {
                        try {
                            const img = await loadImage(team.img);
                            if (img) ctx.drawImage(img, startX + columnWidth - 140, teamY - 20, 30, 30);
                        } catch (err) {
                            console.error('Error loading image:', err);
                        }
                    }
                }
            }

            // let gl = 0;

            // for (let index = 0; index < matchesInColumn.length; index++) {
            //     let match = matchesInColumn[index];
            //     if (!match) break;


            //     if (nextColumnStatus === 3) {
            //         if (index % 2 < 1) {
            //             // console.log(columnKeys)
            //             // console.log(columnIndex)

            //             const nextColumn = groupedByColumns[columnIndex + 1];

            //             // console.log(actualColumn)
            //             // console.log(nextColumn)

            //             const nextMatch = nextColumn[gl];

            //             console.log(match)
            //             console.log(nextMatch)

            //             // const nextMatchNextColumnIndex = index

            //             // let nextMatch = groupedByColumns[nextColumn];
            //             // // if (!nextMatch) continue;

            //             // // console.log(nextMatch)

            //             // // console.log(match.yCord)

            //             ctx.fillStyle = '#353535';
            //             ctx.strokeStyle = '#555555';
            //             ctx.beginPath();

            //             console.log(startX + 300, match.yCord)
            //             console.log(startX + 400, nextMatch.yCord)

            //             ctx.moveTo(startX + 300, match.yCord);
            //             ctx.lineTo(startX + 400, nextMatch.yCord);

            //             ctx.lineWidth = 4;
            //             ctx.lineCap = "round";
            //             ctx.stroke();

            //             gl++;
            //         }
            //     }

            // }
        }
        startY = startY + 700;

        for (let columnIndex = 0; columnIndex < columnKeys.length; columnIndex++) {
            const column = columnKeys[columnIndex];
            const matchesInColumn = groupedByColumns[column];

            //let divider;
            let nextColumnStatus;

            if (columnIndex < columnKeys.length - 1) {
                const nextColumn = columnKeys[columnIndex + 1];
                const nextColumnMatches = groupedByColumns[nextColumn].length;

                // Perform any adjustments if the next column has more matches
                if (nextColumnMatches > matchesInColumn.length) {
                    // console.log(`kolumna ${parseInt(column)+1} ma mniej meczy niz kolumna ${parseInt(nextColumn)+1}.`);
                    nextColumnStatus = 1;

                } else if (nextColumnMatches === matchesInColumn.length) {
                    // console.log(`kolumna ${parseInt(column)+1} ma tyle samo meczy co kolumna ${parseInt(nextColumn)+1}.`);
                    nextColumnStatus = 2;

                } else {
                    // console.log(`kolumna ${parseInt(column)+1} ma wiecej meczy niz kolumna ${parseInt(nextColumn)+1}.`);
                    nextColumnStatus = 3;

                }
            }

            const startX = marginX + column * columnWidth;


            // let gl = 0;

            for (let indexx = 0; indexx < matchesInColumn.length; indexx++) {
                let match = matchesInColumn[indexx];
                if (!match) break;

                const nextColumn = groupedByColumns[columnIndex + 1];
                if (!nextColumn) continue;

                const ileRazyWiecejMeczyWNastepnejKolumnie = nextColumn.length / matchesInColumn.length;
                console.log(ileRazyWiecejMeczyWNastepnejKolumnie)

                let gl = Math.floor(indexx * ileRazyWiecejMeczyWNastepnejKolumnie);

                if (nextColumnStatus === 3) {
                    if (indexx % 2 < 1) {
                        let nextMatch = nextColumn[gl];
                        if (!nextMatch) continue;

                        ctx.fillStyle = '#353535';
                        ctx.strokeStyle = '#555555';
                        ctx.beginPath();

                        ctx.moveTo(startX + 300, match.yCord + 60);
                        ctx.lineTo(startX + 350, match.yCord + 60);

                        ctx.moveTo(startX + 350, match.yCord + 60);
                        ctx.lineTo(startX + 350, nextMatch.yCord + 60);

                        ctx.moveTo(startX + 350, nextMatch.yCord + 60);
                        ctx.lineTo(startX + 400, nextMatch.yCord + 60);

                        ctx.lineWidth = 4;
                        ctx.lineCap = "round";
                        ctx.stroke();

                    } else {

                        let nextMatch = nextColumn[gl];

                        ctx.fillStyle = '#353535';
                        ctx.strokeStyle = '#555555';
                        ctx.beginPath();

                        ctx.moveTo(startX + 300, match.yCord + 60);
                        ctx.lineTo(startX + 350, match.yCord + 60);

                        ctx.moveTo(startX + 350, match.yCord + 60);
                        ctx.lineTo(startX + 350, nextMatch.yCord + 60);

                        ctx.moveTo(startX + 350, nextMatch.yCord + 60);
                        ctx.lineTo(startX + 400, nextMatch.yCord + 60);

                        ctx.lineWidth = 4;
                        ctx.lineCap = "round";
                        ctx.stroke();

                    }

                } else if (nextColumnStatus === 2) {

                    let nextMatch = nextColumn[gl];
                    if (!nextMatch) continue;

                    ctx.fillStyle = '#353535';
                    ctx.strokeStyle = '#555555';
                    ctx.beginPath();

                    ctx.moveTo(startX + 300, match.yCord + 60);
                    ctx.lineTo(startX + 400, match.yCord + 60);

                    ctx.lineWidth = 4;
                    ctx.lineCap = "round";
                    ctx.stroke();

                } else if (nextColumnStatus === 1) {

                    let nextMatch1 = nextColumn[gl];
                    gl++;
                    let nextMatch2 = nextColumn[gl];
                    if (!nextMatch1 || !nextMatch2) continue;

                    ctx.fillStyle = '#353535';
                    ctx.strokeStyle = '#555555';
                    ctx.beginPath();

                    ctx.moveTo(startX + 300, match.yCord + 60);
                    ctx.lineTo(startX + 350, match.yCord + 60);

                    ctx.moveTo(startX + 350, match.yCord + 60);
                    ctx.lineTo(startX + 350, nextMatch1.yCord + 60);

                    ctx.moveTo(startX + 350, nextMatch1.yCord + 60);
                    ctx.lineTo(startX + 400, nextMatch1.yCord + 60);

                    // ctx.moveTo(startX + 300, match.yCord + 60);
                    // ctx.lineTo(startX + 350, match.yCord + 60);

                    // ctx.moveTo(startX + 350, match.yCord + 60);
                    // ctx.lineTo(startX + 350, nextMatch2.yCord + 60);

                    // ctx.moveTo(startX + 350, nextMatch2.yCord + 60);
                    // ctx.lineTo(startX + 400, nextMatch2.yCord + 60);

                    ctx.lineWidth = 4;
                    ctx.lineCap = "round";
                    ctx.stroke();

                }
                // gl++;

            }
        }


    }

    const buffer = canvas.toBuffer('image/png');

    return buffer;
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
            return;
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