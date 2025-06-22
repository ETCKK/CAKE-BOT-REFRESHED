const { SlashCommandBuilder } = require('discord.js');
const { joinVoiceChannel } = require('@discordjs/voice');
const VoiceConnectionHandler = require('../handlers/VoiceConnectionHandler.js');

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

        interaction.reply(locales.joined + channel.name);

        const handler = new VoiceConnectionHandler({
            connection: connection,
            channel: channel,
            interaction: interaction,
            locales: locales
        });

        handler.init();
    },
}