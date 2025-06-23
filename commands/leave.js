const { SlashCommandBuilder } = require('discord.js');
const { getVoiceConnection } = require('@discordjs/voice');

const command = require("../locales/commands.json").leave;
module.exports = {
    data: new SlashCommandBuilder()
        .setName(command.name['en-US'])
        .setDescription(command.description['en-US'])
        .setNameLocalizations(command.name)
        .setDescriptionLocalizations(command.description),

    async execute(interaction, client, locales) {

        const voiceChannel = interaction.member.voice.channel;
        if (!voiceChannel) {
            return await interaction.reply(locales.noVoiceChannel);
        }

        const connection = getVoiceConnection(voiceChannel.guild.id);
        if (!connection) {
            return await interaction.reply(locales.noBotVoiceChannel);
        }

        try {
            connection.destroy();
            client.voiceConnections.delete(voiceChannel.id);
            interaction.reply(locales.left + voiceChannel.name);
        } catch (error) {
            console.error(error);
            return await interaction.reply(locales.destroyError);
        }

    },
};