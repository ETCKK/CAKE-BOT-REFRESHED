const { ElevenLabsClient } = require('@elevenlabs/elevenlabs-js');
const { StreamType } = require("@discordjs/voice");
const { Readable } = require("stream");
require('dotenv').config();

let elevenlabs = null;

if (process.env.ELEVENLABS_API_KEY) {
    elevenlabs = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY });
}

function monoToStereo(buffer) {
    const monoSamples = buffer.length / 2;
    const stereoBuffer = Buffer.alloc(monoSamples * 4);

    for (let i = 0; i < monoSamples; i++) {
        const sample = buffer.readInt16LE(i * 2);
        stereoBuffer.writeInt16LE(sample, i * 4);
        stereoBuffer.writeInt16LE(sample, i * 4 + 2);
    }

    return stereoBuffer;
}


async function getElevenTTS(text) {

    if (!elevenlabs) {
        throw new Error("ELEVENLABS_API_KEY is missing. Please set it in the .env file.");
    }

    const audio = await elevenlabs.textToSpeech.stream('rLW6IpWSofR3nIpR8RYx', {
        text: text,
        modelId: 'eleven_multilingual_v2',
        outputFormat: 'pcm_48000',
    });

    const nodeStream = Readable.fromWeb(audio);
    const chunks = [];

    for await (const chunk of nodeStream) {
        chunks.push(chunk);
    }

    const monoBuffer = Buffer.concat(chunks);
    const stereoBuffer = monoToStereo(monoBuffer);

    const stream = Readable.from(stereoBuffer);

    return { data: stream, options: { streamType: StreamType.Raw } };
}

module.exports = { getElevenTTS };