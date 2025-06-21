const { SlashCommandBuilder } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource } = require('@discordjs/voice');
const { queryLMStudio } = require('../utils/lmstudio/lmstudio.js');
const { queryGroq } = require('../utils/groq/groq.js');
const { queryOpenAI } = require('../utils/openai/openai.js');
const openai_models = require('../utils/openai/models.json');
const Transcriber = require("discord-speech-to-text");
const ConnectionHandler = require('../handlers/ConnectionHandler.js');
const googleTTS = require('google-tts-api');
const { on } = require('form-data');
require('dotenv').config();

const command = require("../locales/commands.json").join;
module.exports = {
    data: new SlashCommandBuilder()
        .setName(command.name['en-US'])
        .setDescription(command.description['en-US'])
        .setNameLocalizations(command.name)
        .setDescriptionLocalizations(command.description)
        .addStringOption(option =>
            option
                .setName(command.model.name['en-US'])
                .setDescription(command.model.description['en-US'])
                .setNameLocalizations(command.model.name)
                .setDescriptionLocalizations(command.model.description)
                .addChoices(
                    ...openai_models
                )
                .setRequired(true)
        ),
    async execute(interaction, client, locales) {
        var speakingCount = 0;

        const model = interaction.options.getString(command.model.name['en-US']) || "gpt-4o";

        const transcriber = new Transcriber(process.env.WIT_TOKEN);

        const channel = interaction.member.voice.channel;

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

        var on_process = false;
        connection.receiver.speaking.on("start", async (userId) => {
            speakingCount++;
            if (on_process) return;
            await transcriber.listen(connection.receiver, userId, client.users.cache.get(userId)).then(async (data) => {

                if (!data.transcript.text) return;

                let user = data.user;
                let text = `"${user.username}" ${data.transcript.text}`;

                interaction.channel.send("***Transcriber:*** " + text);

                ConnectionHandler.addPrompt(text);
                ///
                if (ConnectionHandler.promptMemory.length == 0) return;

                if (speakingCount > 0 && ConnectionHandler.promptMemory.length < 3) return;

                const content = ConnectionHandler.combinePrompts();
                console.log(ConnectionHandler.promptMemory);
                ConnectionHandler.clearPrompts();

                on_process = true;

                // Send query to Groq (API) or LM Studio (Local) or OpenAI (API)
                var answer = await queryOpenAI(content, model);

                console.log('"CAKE BOT" ' + answer);

                if (answer.startsWith('!quit')) {
                    const reason = answer.substring(6);
                    if (connection) {
                        connection.destroy();
                        return await interaction.channel.send(locales.botLeft[0] + channel.name + "\n" + locales.botLeft[1] + reason);
                    }
                }

                if (answer.startsWith('!silent')) {
                    interaction.channel.send("sessiz kalmayı tercih etti.");
                    on_process = false;

                } else if (answer.startsWith("!text")) {
                    const message = answer.substring(6);
                    interaction.channel.send(message);
                    on_process = false;
                } else if (answer.startsWith("!voice")) {
                    const voice = answer.substring(7);
                    const parts = googleTTS.getAllAudioUrls(voice, {
                        lang: 'tr',
                        slow: false,
                        host: 'https://translate.google.com',
                    });

                    for (const part of parts) {
                        const url = part.url;
                        const resource = createAudioResource(url);

                        player.play(resource);

                        player.once("idle", () => {
                            on_process = false;
                        });

                    }

                    //interaction.channel.send(`**${user.username}:** ${text}`);
                }

            });
        });

        connection.receiver.speaking.on("end", async (userId) => {

            speakingCount--;



        });
    },
}