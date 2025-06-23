const { StreamType } = require("@discordjs/voice");
const googleTTS = require("google-tts-api");
const { spawn } = require('child_process');

function getGoogleTTS(text, lang = "en") {
    const parts = googleTTS.getAllAudioUrls(text, {
        lang: lang,
        slow: false,
        host: 'https://translate.google.com',
    });

    const ffmpeg = spawn('ffmpeg', parts.length === 1
        ? [
            '-hide_banner', '-loglevel', 'error',
            '-i', parts[0].url,
            '-filter:a', 'atempo=1.35',
            '-f', 'mp3',
            'pipe:1',
        ]
        : [
            '-hide_banner', '-loglevel', 'error',
            ...parts.flatMap(part => ['-i', part.url]),
            '-filter_complex', `${parts.map((_, i) => `[${i}:a]`).join('')}concat=n=${parts.length}:v=0:a=1,atempo=1.35[a]`,
            '-map', '[a]',
            '-f', 'mp3',
            'pipe:1',
        ]
    );

    const stream = ffmpeg.stdout;

    return { data: stream, options: { streamType: StreamType.Arbitrary } }

}

module.exports = { getGoogleTTS };