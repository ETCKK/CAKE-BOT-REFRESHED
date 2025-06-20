const { SlashCommandBuilder } = require('discord.js');
const command = require("../locales/commands.json").ping;

module.exports = {
    data: new SlashCommandBuilder()
        .setName(command.name['en-US'])
        .setDescription(command.description['en-US'])
        .setNameLocalizations(command.name)
        .setDescriptionLocalizations(command.description),

    async execute(interaction, client, locales) {
        await interaction.reply('Pong!');
    },
};