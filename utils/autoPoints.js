const { predictionSchema } = require("../models/Prediction");
const { autoPointsSchema } = require("../models/autoPoints.js");

const settings = require('./settings.json');
const discord = require("discord.js");
const moment = require("moment-timezone");

const logsChannelId = "1309112371385729054";

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function odmiana(liczba, pojedyncza, mnoga, mnoga_dopelniacz) {
    liczba = Math.abs(liczba); // tylko jeśli mogą zdarzyć się liczby ujemne
    if (liczba === 1) return pojedyncza;
    var reszta10 = liczba % 10;
    var reszta100 = liczba % 100;
    if (reszta10 > 4 || reszta10 < 2 || (reszta100 < 15 && reszta100 > 11))
        return mnoga_dopelniacz;
    return mnoga;
}

// function toHoursAndMinutes(totalMinutes) {
//     const hours = Math.floor(totalMinutes / 60);
//     const minutes = totalMinutes % 60;

//     return `**${hours}** ${odmiana(hours, "godzina", "godziny", "godzin")} **${minutes}** ${odmiana(minutes, "minuta", "minuty", "minut")}`;
// }

function topPredictionUsers(response) {
    let users = [];

    for (const object of response) {
        const userIndex = users.findIndex(user => user.userId === object.userId);

        if (userIndex < 0) users.push({ userId: object.userId, points: object.points })
        else users[userIndex].points += object.points;
    }

    users.sort((a, b) => b.points - a.points);

    return users;
}

function momentCalculateWeekly(date) {
    const momentWeekStart = date.startOf('isoWeek');

    const formattedWeekStart = momentWeekStart.format("YYYY-MM-DD");
    const formattedWeekEnd = momentWeekStart.add(7, "days").format("YYYY-MM-DD");

    //const polishTimestampOfStartOfTheWeek = moment.tz(`${formattedWeekStart} 00:00:00`, `Europe/Warsaw`).unix();
    const polishTimestampOfEndOfTheWeek = moment.tz(`${formattedWeekEnd} 00:00:00`, `Europe/Warsaw`).unix();

    const fromBeginningToStartOfTheWeek = moment(`${formattedWeekStart} 00:00:00`).unix();

    return { fromBeginningToStartOfTheWeek, polishTimestampOfEndOfTheWeek };
}

const indexPrefix = {
    0: `**1.**`,
    1: `**2.**`,
    2: `**3.**`,
    3: `**4.**`,
    4: `**5.**`,
};

function objectCalculator(object, type) {
    let response = "";

    if (object.userId) {
        response = `<@${object.userId}>`
    }

    // response += ` ${settings.emoji_arrow_animated} `;

    if (type == "points") {
        response += ` **${numberWithCommas(object.points)}** ${odmiana(object.points, "punkt", "punkty", "punktów")}`;
    }

    return response;
}

function statisticsDescription({ guild, slicedSchemaResponse, timestamp, type, link, title, reward, timeType }) {
    let description = "";

    for (let i = 0; i < 5; i++) {
        const lineStartText = indexPrefix[i];

        if (slicedSchemaResponse[i]) {
            const object = objectCalculator(slicedSchemaResponse[i], type);

            description += `${lineStartText} ${object}\n${i == 0 ? `\n` : ``}`;
        } else {
            description += `${lineStartText} ―\n`;
        }
    }

    //description += `\n${settings.emoji_arrow_animated} TOP 1 otrzymuje ${reward}\n`;

    // if (slicedSchemaResponse[0] && !slicedSchemaResponse[0].clanTag && timeType == "weekly") {
    //     description += `test\n`;
    // }

    description += `\nResetuje się <t:${timestamp}:R>`;

    let embed = new discord.EmbedBuilder()
        .setColor(settings.color_light_blue)
        .setTitle(title)
        .setDescription(description)
        .setThumbnail(guild.iconURL())
        .setFooter({ iconURL: guild.iconURL(), text: "VLR Tracker | Odświeża się co 5 minut" })

    // const row = new discord.ActionRowBuilder()
    //     .addComponents(
    //         new discord.ButtonBuilder()
    //             .setLabel('ZOSTAŃ TOP 1')
    //             .setURL(link)
    //             .setStyle(discord.ButtonStyle.Link),
    //     )

    return {
        embeds: [embed.data],
        // components: [row]
    }
}

///////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////  STATYSTYKI TYGODNIOWE PUNKTOWE  /////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////

module.exports.calculateWeeklyPredictionPoints = async (guild, date) => {
    const { fromBeginningToStartOfTheWeek, polishTimestampOfEndOfTheWeek } = momentCalculateWeekly(date);

    const schemaResponse = await predictionSchema.find({ guildId: guild.id, checkedAt: { $gte: fromBeginningToStartOfTheWeek } });

    const slicedSchemaResponse = topPredictionUsers(schemaResponse).slice(0, 5);

    let newMessage = statisticsDescription({
        guild,
        slicedSchemaResponse,
        timestamp: polishTimestampOfEndOfTheWeek,
        type: "points",
        //link: "https://ptb.discord.com/channels/785823704805802014/834118201431425034",
        title: "Statystyki typowania",
        //reward: "**1x Skrzynka zwykła** do !eq",
        timeType: "weekly"
    });

    return {
        newMessage,
        polishTimestampOfEndOfTheWeek,
        slicedSchema: slicedSchemaResponse,
    }
}

module.exports.sendWeeklyPredictionStatistics = async (guild, channel) => {
    const date = moment().tz('Europe/Warsaw');

    const response = await this.calculateWeeklyPredictionPoints(guild, date);

    const weeklyMsg = await channel.send(response.newMessage);

    await autoPointsSchema.updateOne({ guildId: guild.id }, { topWeeklyPointsMessageId: weeklyMsg.id, topWeeklyPointsRewardTimestamp: response.polishTimestampOfEndOfTheWeek });
}

module.exports.updateWeeklyPredictionStatistics = async (guild, channel, messageId) => {
    const date = moment().tz('Europe/Warsaw');

    const response = await this.calculateWeeklyPredictionPoints(guild, date);

    const { topWeeklyPointsRewardTimestamp } = await autoPointsSchema.findOneAndUpdate({ guildId: guild.id }, { topWeeklyPointsRewardTimestamp: response.polishTimestampOfEndOfTheWeek });

    if (topWeeklyPointsRewardTimestamp != "0" && response.polishTimestampOfEndOfTheWeek > topWeeklyPointsRewardTimestamp) {

        const subtractedDate = moment().tz('Europe/Warsaw').subtract(1, "day").format("YYYY-MM-DD");
        const lastDate = moment.tz(`${subtractedDate} 12:00:00`, `Europe/Warsaw`);

        const oldResponse = await this.calculateDailyPredictionStatistics(guild, lastDate);

        if (oldResponse.slicedSchema) {
            for (let i = 0; i < oldResponse.slicedSchema.length; i++) {
                let member;

                try {
                    member = await guild.members.fetch(oldResponse.slicedSchema[i].userId)
                } catch (err) {

                }

                if (!member) continue;

                // try {
                //     await member.send({ content: `Gratulacje, udało Ci się zająć ${i + 1} miejsce w topce tygodniowej wiadomości i otrzymujesz za to rolę **piwniczak** na tydzień${i == 0 ? ` oraz **skrzynka zwykla** do !eq` : `!`}` });
                // } catch (err) { /* empty */ }

                const channel = guild.channels.cache.get(logsChannelId);

                if (channel) {
                    try {
                        await channel.send({
                            embeds: [
                                new discord.EmbedBuilder()
                                    .setTitle("Typowanie")
                                    .setDescription(`<@${member.id}> zajął ${i + 1} miejsce w **top typowania tygodnia**`)
                                    .setColor(settings.color_dark_purple)

                            ],
                        });
                    } catch (err) {
                        console.log(err)
                    }
                }
            }
        }
    }

    let message;

    try {
        message = await channel.messages.fetch(messageId);
    } catch (err) {
        console.log(`ERROR autoStatistics.js -> nie znaleziono auto-wiadomości do fetchowania, odnawianie statystyk WEEKLY POINTS`)
        await this.sendWeeklyPredictionStatistics(guild, channel);
    }

    try {
        await message.edit(response.newMessage);
    } catch (err) {
        console.log(`ERROR autoStatistics.js -> nie można zedytować auto-wiadomości WEEKLY POINTS`)
    }
}