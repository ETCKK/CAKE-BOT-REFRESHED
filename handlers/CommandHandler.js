const fs = require('fs');
const path = require('path');
const { Collection } = require('discord.js');

class CommandHandler {
    constructor(client) {
        this.client = client;
    }

    init(commandsPath) {
        this.client.commands = new Collection();

        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

        for (const file of commandFiles) {
            const filePath = path.join(commandsPath, file);
            const command = require(filePath);
            if ('data' in command && 'execute' in command) {
                this.client.commands.set(command.data.name, command);
            }
        }

    }
}

module.exports = CommandHandler;