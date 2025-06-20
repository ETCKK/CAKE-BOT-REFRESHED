const { SlashCommandBuilder } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource } = require('@discordjs/voice');
const { queryLMStudio } = require('../utils/lmstudio.js');
const { queryGroq } = require('../utils/groq.js');
const Transcriber = require("discord-speech-to-text");
const googleTTS = require('google-tts-api');
require('dotenv').config();

const command = require("../locales/commands.json").join;
module.exports = {
    data: new SlashCommandBuilder()
        .setName(command.name['en-US'])
        .setDescription(command.description['en-US'])
        .setNameLocalizations(command.name)
        .setDescriptionLocalizations(command.description),
    async execute(interaction, client, locales) {
        

        const transcriber = new Transcriber(process.env.WIT_TOKEN);

        const channel = interaction.member.guild.channels.cache.get(interaction.member.voice.channel.id);
        
        if (!channel) {
            return await interaction.reply(locales.noVoiceChannel);
        }

        const connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator,
            selfDeaf: false,
            selfMute: false
        });

        interaction.reply(locales.joined + channel.name);

        const player = createAudioPlayer();
        connection.subscribe(player);

        connection.receiver.speaking.on("start", async (userId) => {
            await transcriber.listen(connection.receiver, userId, client.users.cache.get(userId)).then(async (data) => {
                
                if (!data.transcript.text) return;
                let text = data.transcript.text;
                let user = data.user;

                // Send query to Groq (API) or LM Studio (Local)
                const answer = await queryLMStudio(text, user);

                if (answer.includes('!quit')) {
                    const reason = answer.substring(answer.indexOf('!quit') + 6);
                    if (connection) {
                        connection.destroy();
                        return await interaction.channel.send(locales.botLeft[0] + channel.name + ". " + locales.botLeft[1] + reason);
                    }
                }

                if (!answer.includes('!silent')){
                
                    const parts = googleTTS.getAllAudioUrls(answer, {
                        lang: 'tr', // Change to your desired language (e.g., 'tr' for Turkish)
                        slow: false,
                        host: 'https://translate.google.com',
                    });

                    for (const part of parts) {
                        const url = part.url;
                        const resource = createAudioResource(url);

                        // Play the TTS audio in the voice channel
                        player.play(resource);
                    }

                    //interaction.channel.send(`**${user.username}:** ${text}`);
                }
            });
        });
    },
}