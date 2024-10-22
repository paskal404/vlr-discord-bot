const activitiesList = [
    "!Help",
    "Programista paskal404",
    "Tracking vlr...",
];

const discord = require("discord.js");

module.exports = {
    name: 'ready',
    once: true,
    execute(client) {
        console.log(`Zalogowano jako ${client.user.displayName}`);

        async function updateStatus() {
            const activityObject = activitiesList[(Math.floor(Math.random() * activitiesList.length))]
            client.user.setActivity({ name: 'Custom Status', state: `${activityObject}`, type: discord.ActivityType.Custom })
        }

        updateStatus();
        const newInterval = setInterval(updateStatus, 1000 * 10);
        client.readyIntervals.push(newInterval)

    },
};