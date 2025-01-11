const { SlashCommandBuilder } = require('discord.js');
const { predictionSchema } = require('../../models/Prediction'); // Model dla wydarzenia
const discord = require("discord.js");
const settings = require("../../utils/settings.json")

const { eventSchema } = require("../../models/Event")

const { createCanvas, loadImage } = require('canvas');

const imageCache = new Map();

async function renderBracketGraphic(bracketData) {
    // Bracket rendering settings
    const rowHeight = 150;           // Height of each match row
    const columnWidth = 400;         // Width of each match column
    const marginX = 50;              // Margin between columns
    const marginY = 20;              // Margin between rows within a column

    let highestXValue = 0;
    let highestYValue = 0;

    // Set initial Y position
    let startY = 50;

    // Loop through each container in the bracketData
    // for (const container of bracketData) {
    for (let i = 0; i < bracketData.length; i++) {
        let container = bracketData[i];

        let groupedByColumns = container.matches.reduce((acc, match) => {
            // If the column doesn't exist in the accumulator, create an empty array
            if (!acc[match.column]) {
                acc[match.column] = [];
            }
            // Push the match to the correct column group
            acc[match.column].push(match);
            return acc;
        }, {});

        bracketData[i].groupedByColumns = groupedByColumns;

        let mostMatches = 0;
        let ColumnWithMostMatches = null;

        // Find the column with the most matches
        for (let kolumna in groupedByColumns) {
            let matchesInColumn = groupedByColumns[kolumna];
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
                    nextColumnStatus = 1;

                } else if (nextColumnMatches === matchesInColumn.length) {
                    nextColumnStatus = 2;

                } else {
                    nextColumnStatus = 3;

                }

                groupedByColumns[column].forEach((obj) => obj.nextColumnStatus = nextColumnStatus);
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
                    column.yCord = additionalY + startY + index * rowHeight - 5;
                    column.xCord = startX;
                }

                match.textYcord = additionalY + startY + index * rowHeight - 5
                match.textXcord = startX

                match.yCord = (additionalY + startY + index * rowHeight);
                match.xCord = (startX);

                if (match.yCord > highestYValue) {
                    highestYValue = match.yCord;
                }

                if (match.xCord > highestXValue) {
                    highestXValue = match.xCord;
                }

                for (const [teamIndex, team] of match.teams.entries()) {
                    const teamY = ((75 / 2) + 8) + additionalY + startY + index * rowHeight + teamIndex * 50;

                    match.teams[teamIndex].yCord = ((75 / 2) + 8) + additionalY + startY + index * rowHeight + teamIndex * 50;
                    match.teams[teamIndex].xCord = startX + 5;

                    match.teams[teamIndex].imgXCord = startX + columnWidth - 140;
                    match.teams[teamIndex].imgYCord = teamY - 20;
                }
            }
        }
        startY = startY + 700;

        // console.log(highestXValue)
        // console.log(highestYValue)
    }

    const canvasWidth = highestXValue + 400;
    const canvasHeight = highestYValue + 150 + 10;
    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext('2d');

    // Set background color
    ctx.fillStyle = '#181818'; // Dark background
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    for (let i = 0; i < bracketData.length; i++) {
        let container = bracketData[i];

        const columnKeys = Object.keys(container.groupedByColumns);
        for (let columnIndex = 0; columnIndex < columnKeys.length; columnIndex++) {
            const column = columnKeys[columnIndex];
            const matchesInColumn = container.groupedByColumns[column];

            for (let index = 0; index < matchesInColumn.length; index++) {
                let match = matchesInColumn[index];

                const nextColumn = container.groupedByColumns[columnIndex + 1];
                if (nextColumn) {

                    const ileRazyWiecejMeczyWNastepnejKolumnie = nextColumn.length / matchesInColumn.length;
    
                    let gl = Math.floor(index * ileRazyWiecejMeczyWNastepnejKolumnie);
    
                    if (match.nextColumnStatus === 3) {
                        if (index % 2 < 1) {
                            let nextMatch = nextColumn[gl];
                            if (!nextMatch) continue;
    
                            ctx.fillStyle = '#353535';
                            ctx.strokeStyle = '#555555';
                            ctx.beginPath();
    
                            ctx.moveTo(match.xCord + 300, match.yCord + 60);
                            ctx.lineTo(match.xCord + 350, match.yCord + 60);
    
                            ctx.moveTo(match.xCord + 350, match.yCord + 60);
                            ctx.lineTo(match.xCord + 350, nextMatch.yCord + 60);
    
                            ctx.moveTo(match.xCord + 350, nextMatch.yCord + 60);
                            ctx.lineTo(match.xCord + 400, nextMatch.yCord + 60);
    
                            ctx.lineWidth = 4;
                            ctx.lineCap = "round";
                            ctx.stroke();
    
                        } else {
    
                            let nextMatch = nextColumn[gl];
    
                            ctx.fillStyle = '#353535';
                            ctx.strokeStyle = '#555555';
                            ctx.beginPath();
    
                            ctx.moveTo(match.xCord + 300, match.yCord + 60);
                            ctx.lineTo(match.xCord + 350, match.yCord + 60);
    
                            ctx.moveTo(match.xCord + 350, match.yCord + 60);
                            ctx.lineTo(match.xCord + 350, nextMatch.yCord + 60);
    
                            ctx.moveTo(match.xCord + 350, nextMatch.yCord + 60);
                            ctx.lineTo(match.xCord + 400, nextMatch.yCord + 60);
    
                            ctx.lineWidth = 4;
                            ctx.lineCap = "round";
                            ctx.stroke();
    
                        }
    
                    } else if (match.nextColumnStatus === 2) {
    
                        let nextMatch = nextColumn[gl];
                        if (!nextMatch) continue;
    
                        ctx.fillStyle = '#353535';
                        ctx.strokeStyle = '#555555';
                        ctx.beginPath();
    
                        ctx.moveTo(match.xCord + 300, match.yCord + 60);
                        ctx.lineTo(match.xCord + 400, match.yCord + 60);
    
                        ctx.lineWidth = 4;
                        ctx.lineCap = "round";
                        ctx.stroke();
    
                    } else if (match.nextColumnStatus === 1) {
    
                        let nextMatch1 = nextColumn[gl];
                        gl++;
                        let nextMatch2 = nextColumn[gl];
                        if (!nextMatch1 || !nextMatch2) continue;
    
                        ctx.fillStyle = '#353535';
                        ctx.strokeStyle = '#555555';
                        ctx.beginPath();
    
                        ctx.moveTo(match.xCord + 300, match.yCord + 60);
                        ctx.lineTo(match.xCord + 350, match.yCord + 60);
    
                        ctx.moveTo(match.xCord + 350, match.yCord + 60);
                        ctx.lineTo(match.xCord + 350, nextMatch1.yCord + 60);
    
                        ctx.moveTo(match.xCord + 350, nextMatch1.yCord + 60);
                        ctx.lineTo(match.xCord + 400, nextMatch1.yCord + 60);
    
                        ctx.lineWidth = 4;
                        ctx.lineCap = "round";
                        ctx.stroke();
    
                    }
                }


                if (index == 0) {
                    ctx.fillStyle = '#FFFFFF';
                    ctx.font = 'bold 16px Arial';
                    ctx.fillText(matchesInColumn[index].columnName, match.xCord, match.textYcord);
                }

                ctx.strokeStyle = '#353535';
                ctx.fillStyle = '#353535';
                ctx.beginPath();
                ctx.roundRect(match.xCord, match.yCord, columnWidth - 100, rowHeight - marginY, 20);
                ctx.stroke();
                ctx.fill();

				
				const imagePromises = match.teams.map(async (team, teamIndex) => {
					if (team.img) {
						if (imageCache.has(team.img)) {
							return { teamIndex: teamIndex, img: imageCache.get(team.img) };
						} else {
							try {
								const img = await loadImage(team.img);
								imageCache.set(team.img, img);
								return { teamIndex: teamIndex, img: img };
							} catch (err) {
								console.error('Error loading image:', err);
								return { teamIndex: teamIndex, img: null };
							}
						}
					}
					return { teamIndex: teamIndex, img: null };
				});

				const images = await Promise.all(imagePromises);

				for (const [teamIndex, team] of match.teams.entries()) {
					ctx.fillStyle = team.isWinner ? '#4BB543' : '#FFFFFF';
					ctx.font = 'bold 16px Arial';
					ctx.fillText(`${team.name} (${team.score})`, team.xCord, team.yCord, 230);

					const image = images.find(img => img.teamIndex === teamIndex);
					if (image && image.img) {
						ctx.drawImage(image.img, team.imgXCord, team.imgYCord, 30, 30);
					}
				}
            }
        }
    }

    const buffer = canvas.toBuffer('image/png');

    return buffer;
}

module.exports = {
    name: "sprawdz-event",
    data: new SlashCommandBuilder()
        .setName('sprawdz-event')
        .setDescription('Sprawdza tabelke danego eventu')

        .addStringOption(option =>
            option.setName('event')
                .setDescription('Podaj event')
                .setAutocomplete(true)
                .setRequired(true))

        .setDMPermission(false)
        .setDefaultMemberPermissions(discord.PermissionFlagsBits.Administrator),

    async autocomplete(interaction) {
        const focusedOption = interaction.options.getFocused(true);

        if (focusedOption.name === 'event') {
            const events = await eventSchema.find({ guildId: interaction.guild.id });

            const filtered = events.filter(event => event.name.startsWith(focusedOption.value));

            interaction.respond(
                filtered.map(event => ({ name: event.name, value: event.eventId })),
            );

            return;
        }
    },
    run: async (client, interaction) => {
        await interaction.reply({ ephemeral: false, content: "Renderowanie grafiki dla Ciebie..." });

        const eventId = interaction.options.getString('event');
        let event = await eventSchema.findOne({ guildId: interaction.guild.id, eventId }).lean();

        if (!event) {
            return interaction.editReply({
                embeds: [
                    new discord.EmbedBuilder()
                        .setTitle("Sprawdzanie eventu")
                        .setColor(settings.color_red)
                        .setDescription("Nie znaleziono podanego eventu! Spróbuj ponownie wpisać komende!")
                ]
            })
        }

		
		console.time("renderBracketGraphic");
        const buffer = await renderBracketGraphic(event.bracketContainers);
		console.timeEnd("renderBracketGraphic");
		
        const attachment = new discord.AttachmentBuilder(Buffer.from(buffer), { compressionLevel: 9 });
        attachment.name = 'bracket.png';

        return interaction.editReply({ content: "", files: [attachment] })



    }
};
