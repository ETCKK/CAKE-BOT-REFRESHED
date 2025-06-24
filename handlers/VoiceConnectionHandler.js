const { createAudioPlayer, createAudioResource } = require('@discordjs/voice');
const { queryOpenAI } = require('../utils/openai/openai.js');
const { getGoogleTTS } = require('../utils/TTS/googleTTS.js');
const Transcriber = require("discord-speech-to-text");
const play = require('play-dl');
const { name } = require('../events/voiceChannelEffectSend.js');
require('dotenv').config();

class VoiceConnectionHandler {

    static BUFFER_SIZE = 5;
    static BUFFER_SAFE = 3;

    processing = false;
    speakers = new Set();
    promptBuffer = [];

    constructor({
        connection,
        channel,
        interaction,
        locales
    }) {
        this.connection = connection;
        this.channel = channel;
        this.interaction = interaction;
        this.locales = locales;
        this.client = interaction.client;
    }

    init() {
        this.transcriber = new Transcriber(process.env.WIT_TOKEN);

        this.player = createAudioPlayer();
        this.connection.subscribe(this.player);

        this.connection.receiver.speaking.on("start", async (userId) => this.onSpeakingStart(userId));
        this.connection.receiver.speaking.on("end", async (userId) => this.onSpeakingEnd(userId));
    }

    async onSpeakingStart(userId) {
        if (this.client.users.cache.get(userId).bot) return;
        this.speakers.add(userId);

        const data = await this.transcriber.listen(this.connection.receiver, userId, this.client.users.cache.get(userId));

        this.process(data);
    }

    async onSpeakingEnd(userId) {
        if (this.client.users.cache.get(userId).bot) return;
        this.speakers.delete(userId);
    }

    async process(data) {

        if (!data.transcript.text || this.checkForDuplicate(data)) return;

        const prompt = {
            user: data.user,
            command: "!voice",
            text: data.transcript.text
        };

        this.promptBuffer.push(prompt);
        while (this.promptBuffer.length > this.BUFFER_SIZE) this.promptBuffer.shift();

        if ((this.speakers.size > 0 && this.promptBuffer.length < this.BUFFER_SAFE) || this.processing) return;

        this.processing = true;

        const input = [...this.promptBuffer];

        this.promptBuffer = [];

        const answer = await queryOpenAI(input, this.client.model.value);

        switch (answer.command) {
            case "!leave":
                this.destroy();
                await this.interaction.channel.send(this.locales.botLeft[0] + this.channel.name + "\n" + this.locales.botLeft[1] + answer.content);
                return;
            case "!silent":
                this.processing = false;
                break;
            case "!text":
                await this.interaction.channel.send(answer.content);
                this.processing = false;
                break;
            case "!voice":
                this.textToSpeech(answer.content);
                break;
            case "!youtube":
                await this.searchAndPlay(answer.content);
                break;
            case "!sound":
                let soundId;
                switch (answer.content) {
                    case "boom":
                        soundId = this.client.soundboardSounds.findKey(name => name === "boom");
                        break;
                    case "what_the_hell":
                        soundId = this.client.soundboardSounds.findKey(name => name === "what_the_hell");
                        break;
                    default:
                        break;

                }

                if (soundId) this.soundBoardSound(soundId);
                this.processing = false;
                break;
            default:
                break;
        }

    }

    async searchAndPlay(query) {
        console.log(`video searching : ${query}`);

        const searchResults = await play.search(query, { limit: 1 });


        if (!searchResults.length || !searchResults[0].url) {
            //await this.textToSpeech("No YouTube results found.");
            return;
        }

        const video = searchResults[0];

        console.log(`video selected : ${video.title}`);
        console.log(`video url : ${video.url}`);

        const stream = await play.stream(video.url, { discordPlayerCompatibility: true });

        const resource = createAudioResource(stream.stream, { inputType: stream.type });

        this.player.play(resource);
        this.player.once('idle', () => this.processing = false);
    }

    async textToSpeech(text, lang = "tr") {

        const stream = getGoogleTTS(text, lang);

        const resource = createAudioResource(stream.data, stream.options);

        this.player.play(resource);
        this.player.once('idle', () => this.processing = false);
    }

    async soundBoardSound(soundId) {
        const sound = this.channel.guild.soundboardSounds.cache.get(soundId);
        if (!sound) return;
        this.channel.sendSoundboardSound(sound);
    }

    checkForDuplicate(data) {
        const user = data.user;
        const text = data.transcript.text;

        if (!this.promptBuffer.some(p => p.user.id == user.id)) return false;

        if (this.promptBuffer.some(p => p.user.id == user.id && p.text.toLowerCase() == text.toLowerCase())) return true;

        if (this.promptBuffer.some(p => p.user.id == user.id && (p.text.includes(text) || text.includes(p.text)))) return true;

        return false;
    }

    async destroy() {
        if (this.connection) {
            this.client.voiceConnections.delete(this.channel.id);
            await this.connection.destroy();
            this.processing = false;
            this.speakers = new Set();
            this.promptBuffer = [];
        }
    }


}

module.exports = VoiceConnectionHandler;