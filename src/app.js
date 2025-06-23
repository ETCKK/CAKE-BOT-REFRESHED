const { Client, GatewayIntentBits } = require('discord.js');
const ClientHandler = require('../handlers/ClientHandler.js');
require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates] });

const clientHandler = new ClientHandler(client, {
    commandsPath: __dirname + '/../commands',
    eventsPath: __dirname + '/../events',
    localesPath: __dirname + '/../locales/lang',
    modelsPath: __dirname + '/../utils/openai'
});
clientHandler.init();

client.login(process.env.TOKEN);