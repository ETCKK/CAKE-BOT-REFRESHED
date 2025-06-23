const { SlashCommandBuilder } = require('discord.js');
const VoiceConnectionHandler = require('../handlers/VoiceConnectionHandler.js');
const { joinVoiceChannel } = require('@discordjs/voice');

const command = require("../locales/commands.json").join;
module.exports = {
    data: new SlashCommandBuilder()
        .setName(command.name['en-US'])
        .setDescription(command.description['en-US'])
        .setNameLocalizations(command.name)
        .setDescriptionLocalizations(command.description),

    async execute(interaction, client, locales) {

        if (!interaction.member.voice.channel) {
            return await interaction.reply(locales.noVoiceChannel);
        }

        const channel = interaction.guild.channels.cache.get(interaction.member.voice.channel.id);

        if (client.voiceConnections.has(channel.id)) {
            return await interaction.reply(locales.alreadyConnected);
        }

        const connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator,
            selfDeaf: false,
            selfMute: false
        });

        if (!connection) {
            return await interaction.reply(locales.connectionError);
        }

        client.voiceConnections.set(channel.id, connection);

        interaction.reply(locales.joined + channel.name);

        connection.handler = new VoiceConnectionHandler({
            connection: connection,
            channel: channel,
            interaction: interaction,
            locales: locales
        });

        connection.handler.init();
    },
}