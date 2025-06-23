const { Events } = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {
        if (!interaction.isChatInputCommand()) return;

        const command = interaction.client.commands.get(interaction.commandName);

        if (!command) {
            console.error(`No command matching ${interaction.commandName} was found.`);
            return;
        }

        try {
            const locale = interaction.locale || 'en-US';
            const locales = client.locales[locale].commands[command.data.name];
            await command.execute(interaction, client, locales);
        } catch (error) {
            console.error(error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp('There was an error while executing this command!');
            } else {
                await interaction.reply('There was an error while executing this command!');
            }
        }
    },
};