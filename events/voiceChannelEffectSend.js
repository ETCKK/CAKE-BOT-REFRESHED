const { Events } = require('discord.js');

module.exports = {
    name: Events.VoiceChannelEffectSend,
    async execute(effect, client) {

        if (!effect.soundId || !client.voiceConnections.has(effect.channelId)) return;
        const sound = effect.guild.soundboardSounds.cache.get(effect.soundId);
        if (!sound || !client.soundboardSounds.has(effect.soundId)) return;

        const handler = client.voiceConnections.get(effect.channelId).handler;
        handler.promptBuffer.push({
            user: client.users.cache.get(effect.userId),
            command: "!sound",
            text: client.soundboardSounds.get(effect.soundId)
        });
    }
}