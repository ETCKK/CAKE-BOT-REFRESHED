const { createAudioPlayer, createAudioResource, StreamType } = require('@discordjs/voice');
const { queryOpenAI } = require('../utils/openai/openai.js');
const Transcriber = require("discord-speech-to-text");
const googleTTS = require('google-tts-api');
const { elevenTTS } = require('../utils/elevenTTS.js');
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
        this.speakers.add(userId);

        const data = await this.transcriber.listen(this.connection.receiver, userId, this.client.users.cache.get(userId));

        this.process(data);
    }

    async onSpeakingEnd(userId) {
        this.speakers.delete(userId);
    }

    async process(data) {

        if (!data.transcript.text || this.checkForDuplicate(data)) return;

        const prompt = {
            user: data.user,
            text: data.transcript.text
        };

        this.promptBuffer.push(prompt);
        while (this.promptBuffer.length > this.BUFFER_SIZE) this.promptBuffer.shift();

        if ((this.speakers.size > 0 && this.promptBuffer.length < this.BUFFER_SAFE) || this.processing) return;

        this.processing = true;

        const content = this.promptBuffer.map(p => `"${p.user.username}" ${p.text}`).join("\n");

        this.promptBuffer = [];

        const answer = await queryOpenAI(content, this.client.model.value);

        switch (answer.command) {
            case "!quit":
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
            default:
                break;
        }

    }

    async textToSpeech(text, lang = "tr") {

        //Google TTS
        const parts = googleTTS.getAllAudioUrls(text, {
            lang: lang,
            slow: false,
            host: 'https://translate.google.com',
        });

        for (const part of parts) {
            const url = part.url;
            const resource = createAudioResource(url);
            this.player.play(resource);
            this.player.once('idle', () => this.processing = false);
        }

        /*
        // ElevenLabs TTS
        const stream = await elevenTTS(text);
        const resource = createAudioResource(stream, { inputType: StreamType.Raw });
        this.player.play(resource);
        this.player.once('idle', () => this.processing = false);
        */
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
            await this.connection.destroy();
            this.processing = false;
            this.speakers = new Set();
            this.promptBuffer = [];
        }
    }

}

module.exports = VoiceConnectionHandler;